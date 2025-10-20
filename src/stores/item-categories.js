// src/stores/item-categories.js
import { defineStore } from 'pinia'
import itemCategoriesService from 'src/services/api/item-categories.service'
import { showSuccess, showError } from 'src/utils/notification'

export const useItemCategoriesStore = defineStore('itemCategories', {
  state: () => ({
    // Categories list
    categories: [],
    totalCategories: 0,
    currentPage: 0,
    pageSize: 20,

    // Current category
    currentCategory: null,

    // Categorized categories
    testingRequired: [],
    samplesRequired: [],
    qrTrackingRequired: [],
    leafCategories: [],
    categoriesWithCompliance: [],

    // Loading states
    isLoading: false,
    isValidating: false,

    // Filters
    filters: {
      search: '',
      isTestingRequired: null,
      isSampleRequired: null,
      isQRTrackingRequired: null,
      defaultUnit: null,
      includeInactive: false
    },

    // Sort
    sortBy: 'displayOrder',
    sortDirection: 'ASC',

    // Cache
    categoriesCache: new Map(),
    statisticsCache: new Map(),
    cacheTimestamps: new Map(),

    // Cache TTL (3 minutes for categories as they change less frequently)
    CACHE_TTL: 3 * 60 * 1000
  }),

  getters: {
    /**
     * Get filtered categories
     */
    filteredCategories: (state) => {
      let filtered = [...state.categories]

      // Apply search filter
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        filtered = filtered.filter(category =>
          category.categoryName.toLowerCase().includes(search) ||
          category.categoryCode?.toLowerCase().includes(search) ||
          category.categoryDescription?.toLowerCase().includes(search)
        )
      }

      // Apply testing required filter
      if (state.filters.isTestingRequired !== null) {
        filtered = filtered.filter(category =>
          category.isTestingRequired === state.filters.isTestingRequired
        )
      }

      // Apply sample required filter
      if (state.filters.isSampleRequired !== null) {
        filtered = filtered.filter(category =>
          category.isSampleRequired === state.filters.isSampleRequired
        )
      }

      // Apply QR tracking required filter
      if (state.filters.isQRTrackingRequired !== null) {
        filtered = filtered.filter(category =>
          category.isQRTrackingRequired === state.filters.isQRTrackingRequired
        )
      }

      // Apply default unit filter
      if (state.filters.defaultUnit) {
        filtered = filtered.filter(category =>
          category.defaultUnit === state.filters.defaultUnit
        )
      }

      return filtered
    },

    /**
     * Get categories grouped by requirements
     */
    categoriesByRequirements: (state) => {
      const groups = {
        testing: [],
        samples: [],
        qrTracking: [],
        none: []
      }

      state.categories.forEach(category => {
        if (category.isTestingRequired) groups.testing.push(category)
        if (category.isSampleRequired) groups.samples.push(category)
        if (category.isQRTrackingRequired) groups.qrTracking.push(category)

        if (!category.isTestingRequired && !category.isSampleRequired && !category.isQRTrackingRequired) {
          groups.none.push(category)
        }
      })

      return groups
    },

    /**
     * Get categories grouped by default unit
     */
    categoriesByDefaultUnit: (state) => {
      const groups = {}
      state.categories.forEach(category => {
        const unit = category.defaultUnit || 'No Unit'
        if (!groups[unit]) {
          groups[unit] = []
        }
        groups[unit].push(category)
      })
      return groups
    },

    /**
     * Get category statistics
     */
    categoryStatistics: (state) => {
      return itemCategoriesService.getCategoryStatisticsSummary(state.categories)
    },

    /**
     * Check if category is loaded
     */
    isCategoryLoaded: (state) => (categoryId) => {
      return state.currentCategory?.recCode === categoryId ||
             state.categoriesCache.has(categoryId)
    },

    /**
     * Get cached category
     */
    getCachedCategory: (state) => (categoryId) => {
      return state.categoriesCache.get(categoryId)
    },

    /**
     * Get categories for dropdown/selection
     */
    categoriesForSelection: (state) => {
      return state.categories.map(category => ({
        label: itemCategoriesService.formatCategoryDisplayName(category),
        value: category.recCode,
        ...category
      }))
    },

    /**
     * Get categories by requirement type
     */
    categoriesRequiringTesting: (state) => {
      return state.categories.filter(category => category.isTestingRequired)
    },

    categoriesRequiringSamples: (state) => {
      return state.categories.filter(category => category.isSampleRequired)
    },

    categoriesRequiringQRTracking: (state) => {
      return state.categories.filter(category => category.isQRTrackingRequired)
    },

    /**
     * Get categories with compliance information
     */
    categoriesWithComplianceInfo: (state) => {
      return state.categories.filter(category => {
        const indicator = itemCategoriesService.getComplianceIndicator(category)
        return indicator.hasCompliance
      })
    }
  },

  actions: {
    /**
     * Fetch all categories
     */
    async fetchCategories(params = {}) {
      this.isLoading = true

      try {
        const queryParams = {
          page: params.page ?? this.currentPage,
          size: params.size ?? this.pageSize,
          sort: this.sortBy,
          direction: this.sortDirection,
          ...params
        }

        const response = await itemCategoriesService.getAllCategories(queryParams)

        if (response.success) {
          this.categories = response.data.content || response.data
          this.totalCategories = response.data.totalElements || this.categories.length
          this.currentPage = response.data.number || 0
          this.pageSize = response.data.size || this.pageSize

          // Cache categories
          this.categories.forEach(category => {
            this.categoriesCache.set(category.recCode, category)
            this.cacheTimestamps.set(category.recCode, Date.now())
          })
        }

        return response
      } catch (error) {
        showError('Failed to fetch categories')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch single category
     */
    async fetchCategory(categoryId) {
      // Check cache first
      if (this.isValidCache(categoryId)) {
        this.currentCategory = this.categoriesCache.get(categoryId)
        return this.currentCategory
      }

      this.isLoading = true

      try {
        const response = await itemCategoriesService.getCategoryById(categoryId)

        if (response.success) {
          this.currentCategory = response.data
          this.categoriesCache.set(categoryId, response.data)
          this.cacheTimestamps.set(categoryId, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch category')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Create category
     */
    async createCategory(categoryData) {
      this.isLoading = true

      try {
        const response = await itemCategoriesService.createCategory(categoryData)

        if (response.success) {
          this.categories.unshift(response.data)
          this.totalCategories++
          this.categoriesCache.set(response.data.recCode, response.data)
          this.cacheTimestamps.set(response.data.recCode, Date.now())

          showSuccess('Category created successfully')
        }

        return response
      } catch (error) {
        showError('Failed to create category')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Update category
     */
    async updateCategory(categoryId, updateData) {
      this.isLoading = true

      try {
        const response = await itemCategoriesService.updateCategory(categoryId, updateData)

        if (response.success) {
          // Update in list
          const index = this.categories.findIndex(c => c.recCode === categoryId)
          if (index !== -1) {
            this.categories[index] = { ...this.categories[index], ...response.data }
          }

          // Update current category
          if (this.currentCategory?.recCode === categoryId) {
            this.currentCategory = { ...this.currentCategory, ...response.data }
          }

          // Update cache
          this.categoriesCache.set(categoryId, response.data)
          this.cacheTimestamps.set(categoryId, Date.now())

          showSuccess('Category updated successfully')
        }

        return response
      } catch (error) {
        showError('Failed to update category')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Delete category
     */
    async deleteCategory(categoryId) {
      // Check if can delete
      const canDelete = await itemCategoriesService.canDeleteCategory(categoryId)
      if (!canDelete) {
        showError('Cannot delete this category as it is being used')
        return false
      }

      this.isLoading = true

      try {
        await itemCategoriesService.deleteCategory(categoryId)

        // Remove from list
        this.categories = this.categories.filter(c => c.recCode !== categoryId)
        this.totalCategories--

        // Clear current if deleted
        if (this.currentCategory?.recCode === categoryId) {
          this.currentCategory = null
        }

        // Clear cache
        this.categoriesCache.delete(categoryId)
        this.cacheTimestamps.delete(categoryId)

        showSuccess('Category deleted successfully')
        return true
      } catch (error) {
        showError('Failed to delete category')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Search categories
     */
    async searchCategories(searchTerm, filters = {}, params = {}) {
      this.isLoading = true

      try {
        const response = await itemCategoriesService.searchCategories(searchTerm, filters, params)

        if (response.success) {
          this.categories = response.data.content || response.data
          this.totalCategories = response.data.totalElements || this.categories.length
        }

        return response
      } catch (error) {
        showError('Search failed')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch categories by requirements
     */
    async fetchCategoriesByRequirements(isTestingRequired, isSampleRequired, isQRTrackingRequired, force = false) {
      const cacheKey = `requirements_${isTestingRequired}_${isSampleRequired}_${isQRTrackingRequired}`

      if (!force && this.isValidCache(cacheKey)) {
        return this.categoriesCache.get(cacheKey)
      }

      try {
        const response = await itemCategoriesService.getCategoriesByRequirements(
          isTestingRequired, isSampleRequired, isQRTrackingRequired
        )

        if (response.success) {
          this.categoriesCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch categories by requirements')
        throw error
      }
    },

    /**
     * Fetch categories by level
     */
    async fetchCategoriesByLevel(categoryLevel, force = false) {
      const cacheKey = `level_${categoryLevel}`

      if (!force && this.isValidCache(cacheKey)) {
        return this.categoriesCache.get(cacheKey)
      }

      try {
        const response = await itemCategoriesService.getCategoriesByLevel(categoryLevel)

        if (response.success) {
          this.categoriesCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch categories by level')
        throw error
      }
    },

    /**
     * Fetch root categories
     */
    async fetchRootCategories(force = false) {
      if (!force && this.isValidCache('root_categories')) {
        return this.categoriesCache.get('root_categories')
      }

      try {
        const response = await itemCategoriesService.getRootCategories()

        if (response.success) {
          this.categoriesCache.set('root_categories', response.data)
          this.cacheTimestamps.set('root_categories', Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch root categories')
        throw error
      }
    },

    /**
     * Fetch leaf categories
     */
    async fetchLeafCategories(force = false) {
      if (!force && this.leafCategories.length > 0) {
        return this.leafCategories
      }

      try {
        const response = await itemCategoriesService.getLeafCategories()

        if (response.success) {
          this.leafCategories = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch leaf categories')
        throw error
      }
    },

    /**
     * Fetch categories by compliance standard
     */
    async fetchCategoriesByCompliance(standard, force = false) {
      const cacheKey = `compliance_${standard}`

      if (!force && this.isValidCache(cacheKey)) {
        return this.categoriesCache.get(cacheKey)
      }

      try {
        const response = await itemCategoriesService.getCategoriesByComplianceStandard(standard)

        if (response.success) {
          this.categoriesCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch categories by compliance standard')
        throw error
      }
    },

    /**
     * Fetch categories by default unit
     */
    async fetchCategoriesByUnit(unit, force = false) {
      const cacheKey = `unit_${unit}`

      if (!force && this.isValidCache(cacheKey)) {
        return this.categoriesCache.get(cacheKey)
      }

      try {
        const response = await itemCategoriesService.getCategoriesByDefaultUnit(unit)

        if (response.success) {
          this.categoriesCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch categories by default unit')
        throw error
      }
    },

    /**
     * Fetch categories requiring testing
     */
    async fetchCategoriesRequiringTesting(force = false) {
      if (!force && this.testingRequired.length > 0) {
        return this.testingRequired
      }

      try {
        const response = await itemCategoriesService.getCategoriesRequiringTesting()

        if (response.success) {
          this.testingRequired = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch categories requiring testing')
        throw error
      }
    },

    /**
     * Fetch categories requiring samples
     */
    async fetchCategoriesRequiringSamples(force = false) {
      if (!force && this.samplesRequired.length > 0) {
        return this.samplesRequired
      }

      try {
        const response = await itemCategoriesService.getCategoriesRequiringSamples()

        if (response.success) {
          this.samplesRequired = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch categories requiring samples')
        throw error
      }
    },

    /**
     * Fetch categories requiring QR tracking
     */
    async fetchCategoriesRequiringQRTracking(force = false) {
      if (!force && this.qrTrackingRequired.length > 0) {
        return this.qrTrackingRequired
      }

      try {
        const response = await itemCategoriesService.getCategoriesRequiringQRTracking()

        if (response.success) {
          this.qrTrackingRequired = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch categories requiring QR tracking')
        throw error
      }
    },

    /**
     * Update display order
     */
    async updateDisplayOrder(categoryId, displayOrder) {
      try {
        const response = await itemCategoriesService.updateDisplayOrder(categoryId, displayOrder)

        if (response.success) {
          // Update local state
          const category = this.categories.find(c => c.recCode === categoryId)
          if (category) {
            category.displayOrder = displayOrder
          }

          if (this.currentCategory?.recCode === categoryId) {
            this.currentCategory.displayOrder = displayOrder
          }

          showSuccess('Display order updated successfully')
        }

        return response
      } catch (error) {
        showError('Failed to update display order')
        throw error
      }
    },

    /**
     * Batch delete categories
     */
    async batchDeleteCategories(categoryIds) {
      this.isLoading = true

      try {
        // Validate that all categories can be deleted
        for (const categoryId of categoryIds) {
          const canDelete = await itemCategoriesService.canDeleteCategory(categoryId)
          if (!canDelete) {
            const category = this.categories.find(c => c.recCode === categoryId)
            showError(`Cannot delete category '${category?.categoryName}' - it is being used`)
            return false
          }
        }

        const response = await itemCategoriesService.batchDeleteCategories(categoryIds)

        if (response.success) {
          // Remove from list
          this.categories = this.categories.filter(c => !categoryIds.includes(c.recCode))
          this.totalCategories -= categoryIds.length

          // Clear current if deleted
          if (this.currentCategory && categoryIds.includes(this.currentCategory.recCode)) {
            this.currentCategory = null
          }

          // Clear cache
          categoryIds.forEach(id => {
            this.categoriesCache.delete(id)
            this.cacheTimestamps.delete(id)
          })

          showSuccess(`${categoryIds.length} categories deleted successfully`)
        }

        return response
      } catch (error) {
        showError('Failed to delete categories')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch category statistics
     */
    async fetchCategoryStatistics(force = false) {
      const cacheKey = 'category_statistics'

      if (!force && this.statisticsCache.has(cacheKey)) {
        return this.statisticsCache.get(cacheKey)
      }

      try {
        const response = await itemCategoriesService.getCategoryStatistics()

        if (response.success) {
          this.statisticsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch category statistics')
        throw error
      }
    },

    // === Validation Methods ===

    /**
     * Validate category code uniqueness
     */
    async validateCategoryCode(categoryCode, excludeId = null) {
      try {
        return await itemCategoriesService.isCategoryCodeUnique(categoryCode, excludeId)
      } catch (error) {
        console.error('Validation failed:', error)
        return false
      }
    },

    /**
     * Validate category name uniqueness
     */
    async validateCategoryName(categoryName, parentCategoryId = null, excludeId = null) {
      try {
        return await itemCategoriesService.isCategoryNameUnique(categoryName, parentCategoryId, excludeId)
      } catch (error) {
        console.error('Validation failed:', error)
        return false
      }
    },

    /**
     * Validate category data
     */
    validateCategoryData(categoryData) {
      return itemCategoriesService.validateCategoryData(categoryData)
    },

    /**
     * Check if category has children
     */
    async checkCategoryHasChildren(categoryId) {
      this.isValidating = true

      try {
        const response = await itemCategoriesService.checkCategoryHasChildren(categoryId)
        return response
      } catch (error) {
        showError('Failed to check category children')
        throw error
      } finally {
        this.isValidating = false
      }
    },

    // === Utility Actions ===

    /**
     * Set filters
     */
    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
    },

    /**
     * Clear filters
     */
    clearFilters() {
      this.filters = {
        search: '',
        isTestingRequired: null,
        isSampleRequired: null,
        isQRTrackingRequired: null,
        defaultUnit: null,
        includeInactive: false
      }
    },

    /**
     * Set sort
     */
    setSort(sortBy, direction = null) {
      this.sortBy = sortBy

      if (direction) {
        this.sortDirection = direction
      } else {
        // Toggle direction if same field
        if (this.sortBy === sortBy) {
          this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC'
        } else {
          this.sortDirection = 'ASC'
        }
      }

      // Re-fetch with new sort
      this.fetchCategories()
    },

    /**
     * Cache management
     */
    isValidCache(key) {
      const timestamp = this.cacheTimestamps.get(key)
      if (!timestamp) return false
      return (Date.now() - timestamp) < this.CACHE_TTL
    },

    clearCache() {
      this.categoriesCache.clear()
      this.statisticsCache.clear()
      this.cacheTimestamps.clear()
    },

    clearExpiredCache() {
      const now = Date.now()
      for (const [key, timestamp] of this.cacheTimestamps.entries()) {
        if (now - timestamp >= this.CACHE_TTL) {
          this.categoriesCache.delete(key)
          this.statisticsCache.delete(key)
          this.cacheTimestamps.delete(key)
        }
      }
    },

    /**
     * Utility methods
     */
    getCategoryLevelIcon(categoryLevel) {
      return itemCategoriesService.getCategoryLevelIcon(categoryLevel)
    },

    getCategoryLevelColor(categoryLevel) {
      return itemCategoriesService.getCategoryLevelColor(categoryLevel)
    },

    getRequirementsIndicator(category) {
      return itemCategoriesService.getRequirementsIndicator(category)
    },

    formatCategoryDisplayName(category) {
      return itemCategoriesService.formatCategoryDisplayName(category)
    },

    getComplianceIndicator(category) {
      return itemCategoriesService.getComplianceIndicator(category)
    },

    getDefaultUnitOptions() {
      return itemCategoriesService.getDefaultUnitOptions()
    },

    getCategoryStatisticsSummary(categories) {
      return itemCategoriesService.getCategoryStatisticsSummary(categories)
    },

    /**
     * Reset store
     */
    resetStore() {
      this.$reset()
      this.clearCache()
    }
  }
})
