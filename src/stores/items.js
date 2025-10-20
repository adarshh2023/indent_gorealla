// src/stores/items.js
import { defineStore } from 'pinia'
import itemsService from 'src/services/api/items.service'
import { showSuccess, showError } from 'src/utils/notification'

export const useItemsStore = defineStore('items', {
  state: () => ({
    // Items list
    items: [],
    totalItems: 0,
    currentPage: 0,
    pageSize: 20,

    // Current item
    currentItem: null,

    // Categorized items
    itemsRequiringTesting: [],
    itemsRequiringSamples: [],
    itemsRequiringQRTracking: [],
    itemsRequiringSerialNumbers: [],
    itemsRequiringReorder: [],
    itemsWithMissingInfo: [],
    recentItems: [],

    // Lookup data
    allMaterials: [],
    allGrades: [],
    allHSNCodes: [],

    // Loading states
    isLoading: false,
    isValidating: false,
    isGeneratingCode: false,

    // Filters
    filters: {
      search: '',
      itemCategoryId: null,
      baseUnitId: null,
      material: null,
      grade: null,
      itemStatus: null,
      isiStandard: null,
      bisStandard: null,
      hsnCode: null,
      isTestingRequired: null,
      isSampleRequired: null,
      isQRTrackingRequired: null,
      isSerialNumberRequired: null,
      preferredVendorId: null,
      minCost: null,
      maxCost: null,
      minWeight: null,
      maxWeight: null,
      color: null,
      minReorderLevel: null,
      maxReorderLevel: null,
      isSystemItem: null,
      includeInactive: false
    },

    // Sort
    sortBy: 'itemName',
    sortDirection: 'ASC',

    // Cache
    itemsCache: new Map(),
    statisticsCache: new Map(),
    analyticsCache: new Map(),
    cacheTimestamps: new Map(),

    // Cache TTL (3 minutes for items)
    CACHE_TTL: 3 * 60 * 1000
  }),

  getters: {
    /**
     * Get filtered items
     */
    filteredItems: (state) => {
      let filtered = [...state.items]

      // Apply search filter
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        filtered = filtered.filter(item =>
          item.itemName.toLowerCase().includes(search) ||
          item.itemCode?.toLowerCase().includes(search) ||
          item.itemDescription?.toLowerCase().includes(search) ||
          item.material?.toLowerCase().includes(search) ||
          item.hsnCode?.toLowerCase().includes(search)
        )
      }

      // Apply category filter
      if (state.filters.itemCategoryId) {
        filtered = filtered.filter(item =>
          item.itemCategoryId === state.filters.itemCategoryId
        )
      }

      // Apply base unit filter
      if (state.filters.baseUnitId) {
        filtered = filtered.filter(item =>
          item.baseUnitId === state.filters.baseUnitId
        )
      }

      // Apply material filter
      if (state.filters.material) {
        filtered = filtered.filter(item =>
          item.material === state.filters.material
        )
      }

      // Apply grade filter
      if (state.filters.grade) {
        filtered = filtered.filter(item =>
          item.grade === state.filters.grade
        )
      }

      // Apply status filter
      if (state.filters.itemStatus) {
        filtered = filtered.filter(item =>
          item.itemStatus === state.filters.itemStatus
        )
      }

      // Apply testing requirements filters
      if (state.filters.isTestingRequired !== null) {
        filtered = filtered.filter(item =>
          item.isTestingRequired === state.filters.isTestingRequired
        )
      }

      if (state.filters.isSampleRequired !== null) {
        filtered = filtered.filter(item =>
          item.isSampleRequired === state.filters.isSampleRequired
        )
      }

      if (state.filters.isQRTrackingRequired !== null) {
        filtered = filtered.filter(item =>
          item.isQRTrackingRequired === state.filters.isQRTrackingRequired
        )
      }

      if (state.filters.isSerialNumberRequired !== null) {
        filtered = filtered.filter(item =>
          item.isSerialNumberRequired === state.filters.isSerialNumberRequired
        )
      }

      // Apply vendor filter
      if (state.filters.preferredVendorId) {
        filtered = filtered.filter(item =>
          item.preferredVendorId === state.filters.preferredVendorId
        )
      }

      // Apply cost range filters
      if (state.filters.minCost !== null) {
        filtered = filtered.filter(item =>
          item.estimatedCost && item.estimatedCost >= state.filters.minCost
        )
      }

      if (state.filters.maxCost !== null) {
        filtered = filtered.filter(item =>
          item.estimatedCost && item.estimatedCost <= state.filters.maxCost
        )
      }

      // Apply system item filter
      if (state.filters.isSystemItem !== null) {
        filtered = filtered.filter(item =>
          item.isSystemItem === state.filters.isSystemItem
        )
      }

      return filtered
    },

    /**
     * Get items grouped by category
     */
    itemsByCategory: (state) => {
      const groups = {}
      state.items.forEach(item => {
        const category = item.itemCategoryName || 'Unknown'
        if (!groups[category]) {
          groups[category] = []
        }
        groups[category].push(item)
      })
      return groups
    },

    /**
     * Get items grouped by status
     */
    itemsByStatus: (state) => {
      const groups = {}
      state.items.forEach(item => {
        const status = item.itemStatus || 'Unknown'
        if (!groups[status]) {
          groups[status] = []
        }
        groups[status].push(item)
      })
      return groups
    },

    /**
     * Get items grouped by material
     */
    itemsByMaterial: (state) => {
      const groups = {}
      state.items.forEach(item => {
        const material = item.material || 'Unknown'
        if (!groups[material]) {
          groups[material] = []
        }
        groups[material].push(item)
      })
      return groups
    },

    /**
     * Get items grouped by requirements
     */
    itemsByRequirements: (state) => {
      const groups = {
        testing: [],
        samples: [],
        qrTracking: [],
        serialNumbers: [],
        none: []
      }

      state.items.forEach(item => {
        if (item.isTestingRequired) groups.testing.push(item)
        if (item.isSampleRequired) groups.samples.push(item)
        if (item.isQRTrackingRequired) groups.qrTracking.push(item)
        if (item.isSerialNumberRequired) groups.serialNumbers.push(item)

        if (!item.isTestingRequired && !item.isSampleRequired &&
            !item.isQRTrackingRequired && !item.isSerialNumberRequired) {
          groups.none.push(item)
        }
      })

      return groups
    },

    /**
     * Get item statistics
     */
    itemStatistics: (state) => {
      return itemsService.getItemStatisticsSummary(state.items)
    },

    /**
     * Check if item is loaded
     */
    isItemLoaded: (state) => (itemId) => {
      return state.currentItem?.recCode === itemId ||
             state.itemsCache.has(itemId)
    },

    /**
     * Get cached item
     */
    getCachedItem: (state) => (itemId) => {
      return state.itemsCache.get(itemId)
    },

    /**
     * Get items for dropdown/selection
     */
    itemsForSelection: (state) => {
      return state.items.map(item => ({
        label: itemsService.formatItemDisplayName(item),
        value: item.recCode,
        ...item
      }))
    },

    /**
     * Get active items for selection
     */
    activeItemsForSelection: (state) => {
      return state.items
        .filter(item => item.itemStatus === 'Active')
        .map(item => ({
          label: itemsService.formatItemDisplayName(item),
          value: item.recCode,
          ...item
        }))
    },

    /**
     * Get items by category for selection
     */
    itemsByCategoryForSelection: (state) => (categoryId) => {
      return state.items
        .filter(item => item.itemCategoryId === categoryId)
        .map(item => ({
          label: itemsService.formatItemDisplayName(item),
          value: item.recCode,
          ...item
        }))
    }
  },

  actions: {
    /**
     * Fetch all items
     */
    async fetchItems(params = {}) {
      this.isLoading = true

      try {
        const queryParams = {
          page: params.page ?? this.currentPage,
          size: params.size ?? this.pageSize,
          sort: this.sortBy,
          direction: this.sortDirection,
          ...params
        }

        const response = await itemsService.getAllItems(queryParams)

        if (response.success) {
          this.items = response.data.content || response.data
          this.totalItems = response.data.totalElements || this.items.length
          this.currentPage = response.data.number || 0
          this.pageSize = response.data.size || this.pageSize

          // Cache items
          this.items.forEach(item => {
            this.itemsCache.set(item.recCode, item)
            this.cacheTimestamps.set(item.recCode, Date.now())
          })
        }

        return response
      } catch (error) {
        showError('Failed to fetch items')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch single item
     */
    async fetchItem(itemId) {
      // Check cache first
      if (this.isValidCache(itemId)) {
        this.currentItem = this.itemsCache.get(itemId)
        return this.currentItem
      }

      this.isLoading = true

      try {
        const response = await itemsService.getItemById(itemId)

        if (response.success) {
          this.currentItem = response.data
          this.itemsCache.set(itemId, response.data)
          this.cacheTimestamps.set(itemId, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch item')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Create item
     */
    async createItem(itemData) {
      this.isLoading = true

      try {
        const response = await itemsService.createItem(itemData)

        if (response.success) {
          this.items.unshift(response.data)
          this.totalItems++
          this.itemsCache.set(response.data.recCode, response.data)
          this.cacheTimestamps.set(response.data.recCode, Date.now())

          showSuccess('Item created successfully')
        }

        return response
      } catch (error) {
        showError('Failed to create item')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Update item
     */
    async updateItem(itemId, updateData) {
      this.isLoading = true

      try {
        const response = await itemsService.updateItem(itemId, updateData)

        if (response.success) {
          // Update in list
          const index = this.items.findIndex(i => i.recCode === itemId)
          if (index !== -1) {
            this.items[index] = { ...this.items[index], ...response.data }
          }

          // Update current item
          if (this.currentItem?.recCode === itemId) {
            this.currentItem = { ...this.currentItem, ...response.data }
          }

          // Update cache
          this.itemsCache.set(itemId, response.data)
          this.cacheTimestamps.set(itemId, Date.now())

          showSuccess('Item updated successfully')
        }

        return response
      } catch (error) {
        showError('Failed to update item')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Delete item
     */
    async deleteItem(itemId) {
      // Check if can delete
      const canDelete = await itemsService.canDeleteItem(itemId)
      if (!canDelete) {
        showError('Cannot delete this item as it is being used')
        return false
      }

      this.isLoading = true

      try {
        await itemsService.deleteItem(itemId)

        // Remove from list
        this.items = this.items.filter(i => i.recCode !== itemId)
        this.totalItems--

        // Clear current if deleted
        if (this.currentItem?.recCode === itemId) {
          this.currentItem = null
        }

        // Clear cache
        this.itemsCache.delete(itemId)
        this.cacheTimestamps.delete(itemId)

        showSuccess('Item deleted successfully')
        return true
      } catch (error) {
        showError('Failed to delete item')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Search items
     */
    async searchItems(searchTerm, filters = {}, params = {}) {
      this.isLoading = true

      try {
        const response = await itemsService.searchItems(searchTerm, filters, params)

        if (response.success) {
          this.items = response.data.content || response.data
          this.totalItems = response.data.totalElements || this.items.length
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
     * Fetch items by category
     */
    async fetchItemsByCategory(categoryId, force = false) {
      const cacheKey = `items_by_category_${categoryId}`

      if (!force && this.isValidCache(cacheKey)) {
        return this.itemsCache.get(cacheKey)
      }

      try {
        const response = await itemsService.getItemsByCategory(categoryId)

        if (response.success) {
          this.itemsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch items by category')
        throw error
      }
    },

    /**
     * Fetch items by status
     */
    async fetchItemsByStatus(status, force = false) {
      const cacheKey = `items_by_status_${status}`

      if (!force && this.isValidCache(cacheKey)) {
        return this.itemsCache.get(cacheKey)
      }

      try {
        const response = await itemsService.getItemsByStatus(status)

        if (response.success) {
          this.itemsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch items by status')
        throw error
      }
    },

    /**
     * Fetch items by material
     */
    async fetchItemsByMaterial(material, grade = null, force = false) {
      const cacheKey = `items_by_material_${material}_${grade || 'all'}`

      if (!force && this.isValidCache(cacheKey)) {
        return this.itemsCache.get(cacheKey)
      }

      try {
        const response = await itemsService.getItemsByMaterial(material, grade)

        if (response.success) {
          this.itemsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch items by material')
        throw error
      }
    },

    /**
     * Fetch items by HSN code
     */
    async fetchItemsByHSNCode(hsnCode, force = false) {
      const cacheKey = `items_by_hsn_${hsnCode}`

      if (!force && this.isValidCache(cacheKey)) {
        return this.itemsCache.get(cacheKey)
      }

      try {
        const response = await itemsService.getItemsByHSNCode(hsnCode)

        if (response.success) {
          this.itemsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch items by HSN code')
        throw error
      }
    },

    /**
     * Fetch items by vendor
     */
    async fetchItemsByVendor(vendorId, force = false) {
      const cacheKey = `items_by_vendor_${vendorId}`

      if (!force && this.isValidCache(cacheKey)) {
        return this.itemsCache.get(cacheKey)
      }

      try {
        const response = await itemsService.getItemsByVendor(vendorId)

        if (response.success) {
          this.itemsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch items by vendor')
        throw error
      }
    },

    // === Testing and Quality Requirements ===

    /**
     * Fetch items requiring testing
     */
    async fetchItemsRequiringTesting(force = false) {
      if (!force && this.itemsRequiringTesting.length > 0) {
        return this.itemsRequiringTesting
      }

      try {
        const response = await itemsService.getItemsRequiringTesting()

        if (response.success) {
          this.itemsRequiringTesting = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch items requiring testing')
        throw error
      }
    },

    /**
     * Fetch items requiring samples
     */
    async fetchItemsRequiringSamples(force = false) {
      if (!force && this.itemsRequiringSamples.length > 0) {
        return this.itemsRequiringSamples
      }

      try {
        const response = await itemsService.getItemsRequiringSamples()

        if (response.success) {
          this.itemsRequiringSamples = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch items requiring samples')
        throw error
      }
    },

    /**
     * Fetch items requiring QR tracking
     */
    async fetchItemsRequiringQRTracking(force = false) {
      if (!force && this.itemsRequiringQRTracking.length > 0) {
        return this.itemsRequiringQRTracking
      }

      try {
        const response = await itemsService.getItemsRequiringQRTracking()

        if (response.success) {
          this.itemsRequiringQRTracking = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch items requiring QR tracking')
        throw error
      }
    },

    /**
     * Fetch items requiring serial numbers
     */
    async fetchItemsRequiringSerialNumbers(force = false) {
      if (!force && this.itemsRequiringSerialNumbers.length > 0) {
        return this.itemsRequiringSerialNumbers
      }

      try {
        const response = await itemsService.getItemsRequiringSerialNumbers()

        if (response.success) {
          this.itemsRequiringSerialNumbers = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch items requiring serial numbers')
        throw error
      }
    },

    // === Inventory Management ===

    /**
     * Fetch items requiring reorder
     */
    async fetchItemsRequiringReorder(force = false) {
      if (!force && this.itemsRequiringReorder.length > 0) {
        return this.itemsRequiringReorder
      }

      try {
        const response = await itemsService.getItemsRequiringReorder()

        if (response.success) {
          this.itemsRequiringReorder = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch items requiring reorder')
        throw error
      }
    },

    /**
     * Fetch items by cost range
     */
    async fetchItemsByCostRange(minCost = null, maxCost = null, force = false) {
      const cacheKey = `items_by_cost_${minCost || 'min'}_${maxCost || 'max'}`

      if (!force && this.isValidCache(cacheKey)) {
        return this.itemsCache.get(cacheKey)
      }

      try {
        const response = await itemsService.getItemsByCostRange(minCost, maxCost)

        if (response.success) {
          this.itemsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch items by cost range')
        throw error
      }
    },

    /**
     * Fetch items with missing information
     */
    async fetchItemsWithMissingInfo(force = false) {
      if (!force && this.itemsWithMissingInfo.length > 0) {
        return this.itemsWithMissingInfo
      }

      try {
        const response = await itemsService.getItemsWithMissingInfo()

        if (response.success) {
          this.itemsWithMissingInfo = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch items with missing information')
        throw error
      }
    },

    /**
     * Fetch recently added items
     */
    async fetchRecentlyAddedItems(limit = 10, force = false) {
      if (!force && this.recentItems.length > 0) {
        return this.recentItems
      }

      try {
        const response = await itemsService.getRecentlyAddedItems(limit)

        if (response.success) {
          this.recentItems = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch recent items')
        throw error
      }
    },

    // === Advanced Features ===

    /**
     * Update item metadata
     */
    async updateItemMetadata(itemId, metadata) {
      try {
        await itemsService.updateItemMetadata(itemId, metadata)

        // Update local state
        const item = this.items.find(i => i.recCode === itemId)
        if (item) {
          item.itemMetadata = metadata
        }

        if (this.currentItem?.recCode === itemId) {
          this.currentItem.itemMetadata = metadata
        }

        showSuccess('Item metadata updated successfully')
        return true
      } catch (error) {
        showError('Failed to update item metadata')
        throw error
      }
    },

    /**
     * Get item metadata
     */
    async getItemMetadata(itemId) {
      try {
        const response = await itemsService.getItemMetadata(itemId)
        return response.data
      } catch (error) {
        showError('Failed to fetch item metadata')
        throw error
      }
    },

    /**
     * Update alternate units
     */
    async updateAlternateUnits(itemId, alternateUnits) {
      try {
        await itemsService.updateAlternateUnits(itemId, alternateUnits)

        // Update local state
        const item = this.items.find(i => i.recCode === itemId)
        if (item) {
          item.alternateUnits = alternateUnits
        }

        if (this.currentItem?.recCode === itemId) {
          this.currentItem.alternateUnits = alternateUnits
        }

        showSuccess('Alternate units updated successfully')
        return true
      } catch (error) {
        showError('Failed to update alternate units')
        throw error
      }
    },

    /**
     * Get alternate units
     */
    async getAlternateUnits(itemId) {
      try {
        const response = await itemsService.getAlternateUnits(itemId)
        return response.data
      } catch (error) {
        showError('Failed to fetch alternate units')
        throw error
      }
    },

    // === Analytics and Statistics ===

    /**
     * Fetch item statistics
     */
    async fetchItemStatistics(force = false) {
      const cacheKey = 'item_statistics'

      if (!force && this.statisticsCache.has(cacheKey)) {
        return this.statisticsCache.get(cacheKey)
      }

      try {
        const response = await itemsService.getItemStatistics()

        if (response.success) {
          this.statisticsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch item statistics')
        throw error
      }
    },

    /**
     * Fetch analytics by category
     */
    async fetchAnalyticsByCategory(force = false) {
      const cacheKey = 'analytics_by_category'

      if (!force && this.analyticsCache.has(cacheKey)) {
        return this.analyticsCache.get(cacheKey)
      }

      try {
        const response = await itemsService.getItemStatisticsByCategory()

        if (response.success) {
          this.analyticsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch category analytics')
        throw error
      }
    },

    /**
     * Fetch analytics by material
     */
    async fetchAnalyticsByMaterial(force = false) {
      const cacheKey = 'analytics_by_material'

      if (!force && this.analyticsCache.has(cacheKey)) {
        return this.analyticsCache.get(cacheKey)
      }

      try {
        const response = await itemsService.getItemStatisticsByMaterial()

        if (response.success) {
          this.analyticsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch material analytics')
        throw error
      }
    },

    /**
     * Fetch testing requirement statistics
     */
    async fetchTestingRequirementStatistics(force = false) {
      const cacheKey = 'testing_statistics'

      if (!force && this.analyticsCache.has(cacheKey)) {
        return this.analyticsCache.get(cacheKey)
      }

      try {
        const response = await itemsService.getTestingRequirementStatistics()

        if (response.success) {
          this.analyticsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch testing statistics')
        throw error
      }
    },

    /**
     * Fetch inventory analytics
     */
    async fetchInventoryAnalytics(force = false) {
      const cacheKey = 'inventory_analytics'

      if (!force && this.analyticsCache.has(cacheKey)) {
        return this.analyticsCache.get(cacheKey)
      }

      try {
        const response = await itemsService.getInventoryAnalytics()

        if (response.success) {
          this.analyticsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch inventory analytics')
        throw error
      }
    },

    /**
     * Fetch cost analytics
     */
    async fetchCostAnalytics(force = false) {
      const cacheKey = 'cost_analytics'

      if (!force && this.analyticsCache.has(cacheKey)) {
        return this.analyticsCache.get(cacheKey)
      }

      try {
        const response = await itemsService.getCostAnalytics()

        if (response.success) {
          this.analyticsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch cost analytics')
        throw error
      }
    },

    // === Lookup Data ===

    /**
     * Fetch all materials
     */
    async fetchAllMaterials(force = false) {
      if (!force && this.allMaterials.length > 0) {
        return this.allMaterials
      }

      try {
        const response = await itemsService.getAllMaterials()

        if (response.success) {
          this.allMaterials = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch materials')
        throw error
      }
    },

    /**
     * Fetch all grades
     */
    async fetchAllGrades(force = false) {
      if (!force && this.allGrades.length > 0) {
        return this.allGrades
      }

      try {
        const response = await itemsService.getAllGrades()

        if (response.success) {
          this.allGrades = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch grades')
        throw error
      }
    },

    /**
     * Fetch all HSN codes
     */
    async fetchAllHSNCodes(force = false) {
      if (!force && this.allHSNCodes.length > 0) {
        return this.allHSNCodes
      }

      try {
        const response = await itemsService.getAllHSNCodes()

        if (response.success) {
          this.allHSNCodes = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch HSN codes')
        throw error
      }
    },

    // === Validation Methods ===

    /**
     * Validate item code uniqueness
     */
    async validateItemCode(itemCode, excludeId = null) {
      try {
        return await itemsService.isItemCodeUnique(itemCode, excludeId)
      } catch (error) {
        console.error('Validation failed:', error)
        return false
      }
    },

    /**
     * Generate item code
     */
    async generateItemCode() {
      this.isGeneratingCode = true

      try {
        const itemCode = await itemsService.generateItemCode()
        return itemCode
      } catch (error) {
        showError('Failed to generate item code')
        throw error
      } finally {
        this.isGeneratingCode = false
      }
    },

    /**
     * Validate item data
     */
    validateItemData(itemData) {
      return itemsService.validateItemDatFE(itemData)
    },

    /**
     * Validate item data against backend
     */
    async validateItemDataOnServer(itemId) {
      this.isValidating = true

      try {
        const response = await itemsService.validateItemData(itemId)
        return response.data
      } catch (error) {
        showError('Failed to validate item data')
        throw error
      } finally {
        this.isValidating = false
      }
    },

    // === Export ===

    /**
     * Export items
     */
    async exportItems(itemIds = null, exportFormat = 'EXCEL', includeMetadata = true) {
      try {
        const response = await itemsService.exportItems(itemIds, exportFormat, includeMetadata)

        if (response.success) {
          showSuccess('Export initiated successfully')
        }

        return response.data
      } catch (error) {
        showError('Failed to export items')
        throw error
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
        itemCategoryId: null,
        baseUnitId: null,
        material: null,
        grade: null,
        itemStatus: null,
        isiStandard: null,
        bisStandard: null,
        hsnCode: null,
        isTestingRequired: null,
        isSampleRequired: null,
        isQRTrackingRequired: null,
        isSerialNumberRequired: null,
        preferredVendorId: null,
        minCost: null,
        maxCost: null,
        minWeight: null,
        maxWeight: null,
        color: null,
        minReorderLevel: null,
        maxReorderLevel: null,
        isSystemItem: null,
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
      this.fetchItems()
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
      this.itemsCache.clear()
      this.statisticsCache.clear()
      this.analyticsCache.clear()
      this.cacheTimestamps.clear()
    },

    clearExpiredCache() {
      const now = Date.now()
      for (const [key, timestamp] of this.cacheTimestamps.entries()) {
        if (now - timestamp >= this.CACHE_TTL) {
          this.itemsCache.delete(key)
          this.statisticsCache.delete(key)
          this.analyticsCache.delete(key)
          this.cacheTimestamps.delete(key)
        }
      }
    },

    /**
     * Utility methods
     */
    getItemStatusIcon(status) {
      return itemsService.getItemStatusIcon(status)
    },

    getItemStatusColor(status) {
      return itemsService.getItemStatusColor(status)
    },

    getRequirementsIndicator(item) {
      return itemsService.getRequirementsIndicator(item)
    },

    formatItemDisplayName(item) {
      return itemsService.formatItemDisplayName(item)
    },

    getCostIndicator(item) {
      return itemsService.getCostIndicator(item)
    },

    getInventoryStatusIndicator(item) {
      return itemsService.getInventoryStatusIndicator(item)
    },

    formatPhysicalProperties(item) {
      return itemsService.formatPhysicalProperties(item)
    },

    getStandardsIndicator(item) {
      return itemsService.getStandardsIndicator(item)
    },

    getVendorStatus(item) {
      return itemsService.getVendorStatus(item)
    },

    formatCurrency(amount, currency = '₹') {
      return itemsService.formatCurrency(amount, currency)
    },

    getMaterialTypeIcon(material) {
      return itemsService.getMaterialTypeIcon(material)
    },

    getItemStatisticsSummary(items) {
      return itemsService.getItemStatisticsSummary(items)
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
