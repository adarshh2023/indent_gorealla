// src/stores/units.js
import { defineStore } from 'pinia'
import unitsService from 'src/services/api/units.service'
import { showSuccess, showError } from 'src/utils/notification'

export const useUnitsStore = defineStore('units', {
  state: () => ({
    // Units list
    units: [],
    totalUnits: 0,
    currentPage: 0,
    pageSize: 20,

    // Current unit
    currentUnit: null,

    // Categorized units
    baseUnits: [],
    systemUnits: [],
    userDefinedUnits: [],
    recentUnits: [],
    unitsWithMissingInfo: [],

    // Conversion data
    conversionHistory: [],
    favoriteConversions: [],
    commonConversions: new Map(),

    // Hierarchy data
    unitHierarchy: new Map(),
    unitPaths: new Map(),

    // Loading states
    isLoading: false,
    isLoadingConversion: false,
    isValidating: false,

    // Filters
    filters: {
      search: '',
      unitType: null,
      unitCategory: null,
      isSystemUnit: null,
      isBaseUnit: null,
      hasConversionFormula: null
    },

    // Sort
    sortBy: 'unitName',
    sortDirection: 'ASC',

    // Cache
    unitsCache: new Map(),
    statisticsCache: new Map(),
    analyticsCache: new Map(),

    // Cache TTL (5 minutes for units as they change less frequently than other data)
    CACHE_TTL: 5 * 60 * 1000,
    cacheTimestamps: new Map()
  }),

  getters: {
    /**
     * Get filtered units
     */
    filteredUnits: (state) => {
      let filtered = [...state.units]

      // Apply search filter
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        filtered = filtered.filter(unit =>
          unit.unitName.toLowerCase().includes(search) ||
          unit.unitCode?.toLowerCase().includes(search) ||
          unit.unitSymbol?.toLowerCase().includes(search) ||
          unit.unitDescription?.toLowerCase().includes(search)
        )
      }

      // Apply type filter
      if (state.filters.unitType) {
        filtered = filtered.filter(unit =>
          unit.unitType === state.filters.unitType
        )
      }

      // Apply category filter
      if (state.filters.unitCategory) {
        filtered = filtered.filter(unit =>
          unit.unitCategory === state.filters.unitCategory
        )
      }

      // Apply system unit filter
      if (state.filters.isSystemUnit !== null) {
        filtered = filtered.filter(unit =>
          unit.isSystemUnit === state.filters.isSystemUnit
        )
      }

      // Apply base unit filter
      if (state.filters.isBaseUnit !== null) {
        const isBase = state.filters.isBaseUnit
        filtered = filtered.filter(unit =>
          isBase ? !unit.baseUnitId : !!unit.baseUnitId
        )
      }

      // Apply conversion formula filter
      if (state.filters.hasConversionFormula !== null) {
        const hasFormula = state.filters.hasConversionFormula
        filtered = filtered.filter(unit =>
          hasFormula ? !!unit.conversionFormula : !unit.conversionFormula
        )
      }

      return filtered
    },

    /**
     * Get units grouped by type
     */
    unitsByType: (state) => {
      const groups = {}
      state.units.forEach(unit => {
        const type = unit.unitType || 'Other'
        if (!groups[type]) {
          groups[type] = []
        }
        groups[type].push(unit)
      })
      return groups
    },

    /**
     * Get units grouped by category
     */
    unitsByCategory: (state) => {
      const groups = {}
      state.units.forEach(unit => {
        const category = unit.unitCategory || 'Other'
        if (!groups[category]) {
          groups[category] = []
        }
        groups[category].push(unit)
      })
      return groups
    },

    /**
     * Get unit statistics
     */
    unitStatistics: (state) => {
      const stats = {
        total: state.units.length,
        byType: {},
        byCategory: {},
        systemUnits: 0,
        userDefined: 0,
        baseUnits: 0,
        derivedUnits: 0
      }

      state.units.forEach(unit => {
        // Count by type
        const type = unit.unitType || 'Other'
        stats.byType[type] = (stats.byType[type] || 0) + 1

        // Count by category
        const category = unit.unitCategory || 'Other'
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1

        // Count system vs user defined
        if (unit.isSystemUnit) {
          stats.systemUnits++
        } else {
          stats.userDefined++
        }

        // Count base vs derived units
        if (!unit.baseUnitId) {
          stats.baseUnits++
        } else {
          stats.derivedUnits++
        }
      })

      return stats
    },

    /**
     * Check if unit is loaded
     */
    isUnitLoaded: (state) => (unitId) => {
      return state.currentUnit?.recCode === unitId ||
             state.unitsCache.has(unitId)
    },

    /**
     * Get cached unit
     */
    getCachedUnit: (state) => (unitId) => {
      return state.unitsCache.get(unitId)
    },

    /**
     * Get units for dropdown/selection
     */
    unitsForSelection: (state) => {
      return state.units.map(unit => ({
        label: unitsService.formatUnitDisplayName(unit),
        value: unit.recCode,
        ...unit
      }))
    },

    /**
     * Get base units for selection
     */
    baseUnitsForSelection: (state) => {
      return state.units
        .filter(unit => !unit.baseUnitId)
        .map(unit => ({
          label: unitsService.formatUnitDisplayName(unit),
          value: unit.recCode,
          ...unit
        }))
    },

    /**
     * Get units by type for selection
     */
    unitsByTypeForSelection: (state) => (unitType) => {
      return state.units
        .filter(unit => unit.unitType === unitType)
        .map(unit => ({
          label: unitsService.formatUnitDisplayName(unit),
          value: unit.recCode,
          ...unit
        }))
    },

    /**
     * Get convertible units for selection
     */
    convertibleUnitsForSelection: (state) => (unitType, excludeUnitId = null) => {
      return state.units
        .filter(unit =>
          unit.unitType === unitType &&
          unit.recCode !== excludeUnitId
        )
        .map(unit => ({
          label: unitsService.formatUnitDisplayName(unit),
          value: unit.recCode,
          ...unit
        }))
    }
  },

  actions: {
    /**
     * Fetch all units
     */
    async fetchUnits(params = {}) {
      this.isLoading = true

      try {
        const queryParams = {
          page: params.page ?? this.currentPage,
          size: params.size ?? this.pageSize,
          sort: this.sortBy,
          direction: this.sortDirection,
          ...params
        }

        const response = await unitsService.getAllUnits(queryParams)

        if (response.success) {
          this.units = response.data.content || response.data
          this.totalUnits = response.data.totalElements || this.units.length
          this.currentPage = response.data.number || 0
          this.pageSize = response.data.size || this.pageSize

          // Cache units
          this.units.forEach(unit => {
            this.unitsCache.set(unit.recCode, unit)
            this.cacheTimestamps.set(unit.recCode, Date.now())
          })
        }

        return response
      } catch (error) {
        showError('Failed to fetch units')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch single unit
     */
    async fetchUnit(unitId) {
      // Check cache first
      if (this.isValidCache(unitId)) {
        this.currentUnit = this.unitsCache.get(unitId)
        return this.currentUnit
      }

      this.isLoading = true

      try {
        const response = await unitsService.getUnitById(unitId)

        if (response.success) {
          this.currentUnit = response.data
          this.unitsCache.set(unitId, response.data)
          this.cacheTimestamps.set(unitId, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch unit')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Create unit
     */
    async createUnit(unitData) {
      this.isLoading = true

      try {
        const response = await unitsService.createUnit(unitData)

        if (response.success) {
          this.units.unshift(response.data)
          this.totalUnits++
          this.unitsCache.set(response.data.recCode, response.data)
          this.cacheTimestamps.set(response.data.recCode, Date.now())

          showSuccess('Unit created successfully')
        }

        return response
      } catch (error) {
        showError('Failed to create unit')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Update unit
     */
    async updateUnit(unitId, updateData) {
      this.isLoading = true

      try {
        const response = await unitsService.updateUnit(unitId, updateData)

        if (response.success) {
          // Update in list
          const index = this.units.findIndex(u => u.recCode === unitId)
          if (index !== -1) {
            this.units[index] = { ...this.units[index], ...response.data }
          }

          // Update current unit
          if (this.currentUnit?.recCode === unitId) {
            this.currentUnit = { ...this.currentUnit, ...response.data }
          }

          // Update cache
          this.unitsCache.set(unitId, response.data)
          this.cacheTimestamps.set(unitId, Date.now())

          showSuccess('Unit updated successfully')
        }

        return response
      } catch (error) {
        showError('Failed to update unit')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Delete unit
     */
    async deleteUnit(unitId) {
      // Check if can delete
      const canDelete = await unitsService.canDeleteUnit(unitId)
      if (!canDelete) {
        showError('Cannot delete this unit as it is being used by other units')
        return false
      }

      this.isLoading = true

      try {
        await unitsService.deleteUnit(unitId)

        // Remove from list
        this.units = this.units.filter(u => u.recCode !== unitId)
        this.totalUnits--

        // Clear current if deleted
        if (this.currentUnit?.recCode === unitId) {
          this.currentUnit = null
        }

        // Clear cache
        this.unitsCache.delete(unitId)
        this.cacheTimestamps.delete(unitId)

        showSuccess('Unit deleted successfully')
        return true
      } catch (error) {
        showError('Failed to delete unit')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Search units
     */
    async searchUnits(searchTerm, unitType, unitCategory, isSystemUnit, isBaseUnit, params = {}) {
      this.isLoading = true

      try {
        const response = await unitsService.searchUnits(
          searchTerm, unitType, unitCategory, isSystemUnit, isBaseUnit, params
        )

        if (response.success) {
          this.units = response.data.content || response.data
          this.totalUnits = response.data.totalElements || this.units.length
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
     * Fetch units by type
     */
    async fetchUnitsByType(unitType, force = false) {
      const cacheKey = `units_by_type_${unitType}`

      if (!force && this.isValidCache(cacheKey)) {
        return this.unitsCache.get(cacheKey)
      }

      try {
        const response = await unitsService.getUnitsByType(unitType)

        if (response.success) {
          this.unitsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch units by type')
        throw error
      }
    },

    /**
     * Fetch units by category
     */
    async fetchUnitsByCategory(unitCategory, force = false) {
      const cacheKey = `units_by_category_${unitCategory}`

      if (!force && this.isValidCache(cacheKey)) {
        return this.unitsCache.get(cacheKey)
      }

      try {
        const response = await unitsService.getUnitsByCategory(unitCategory)

        if (response.success) {
          this.unitsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch units by category')
        throw error
      }
    },

    /**
     * Fetch units by type and category
     */
    async fetchUnitsByTypeAndCategory(unitType, unitCategory, params = {}) {
      try {
        const response = await unitsService.getUnitsByTypeAndCategory(unitType, unitCategory, params)
        return response.data
      } catch (error) {
        showError('Failed to fetch units by type and category')
        throw error
      }
    },

    /**
     * Fetch base units
     */
    async fetchBaseUnits(force = false) {
      if (!force && this.baseUnits.length > 0) {
        return this.baseUnits
      }

      try {
        const response = await unitsService.getBaseUnits()

        if (response.success) {
          this.baseUnits = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch base units')
        throw error
      }
    },

    /**
     * Fetch derived units by base unit
     */
    async fetchDerivedUnitsByBaseUnit(baseUnitId, force = false) {
      const cacheKey = `derived_units_${baseUnitId}`

      if (!force && this.isValidCache(cacheKey)) {
        return this.unitsCache.get(cacheKey)
      }

      try {
        const response = await unitsService.getDerivedUnitsByBaseUnit(baseUnitId)

        if (response.success) {
          this.unitsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch derived units')
        throw error
      }
    },

    /**
     * Fetch convertible units
     */
    async fetchConvertibleUnits(unitType, excludeUnitId = null, force = false) {
      const cacheKey = `convertible_${unitType}_${excludeUnitId || 'all'}`

      if (!force && this.isValidCache(cacheKey)) {
        return this.unitsCache.get(cacheKey)
      }

      try {
        const response = await unitsService.getConvertibleUnits(unitType, excludeUnitId)

        if (response.success) {
          this.unitsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch convertible units')
        throw error
      }
    },

    /**
     * Fetch system units
     */
    async fetchSystemUnits(force = false) {
      if (!force && this.systemUnits.length > 0) {
        return this.systemUnits
      }

      try {
        const response = await unitsService.getSystemUnits()

        if (response.success) {
          this.systemUnits = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch system units')
        throw error
      }
    },

    /**
     * Fetch user-defined units
     */
    async fetchUserDefinedUnits(force = false) {
      if (!force && this.userDefinedUnits.length > 0) {
        return this.userDefinedUnits
      }

      try {
        const response = await unitsService.getUserDefinedUnits()

        if (response.success) {
          this.userDefinedUnits = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch user-defined units')
        throw error
      }
    },

    /**
     * Mark unit as system unit
     */
    async markAsSystemUnit(unitId, isSystemUnit) {
      try {
        await unitsService.markAsSystemUnit(unitId, isSystemUnit)

        // Update local state
        const unit = this.units.find(u => u.recCode === unitId)
        if (unit) {
          unit.isSystemUnit = isSystemUnit
        }

        if (this.currentUnit?.recCode === unitId) {
          this.currentUnit.isSystemUnit = isSystemUnit
        }

        showSuccess(`Unit marked as ${isSystemUnit ? 'system' : 'user-defined'} unit`)
        return true
      } catch (error) {
        showError('Failed to update system unit flag')
        throw error
      }
    },

    // === Conversion Operations ===

    /**
     * Convert value between units
     */
    async convertValue(conversionData) {
      this.isLoadingConversion = true

      try {
        const response = await unitsService.convertValue(conversionData)

        if (response.success) {
          // Store in conversion history
          this.conversionHistory.unshift({
            ...conversionData,
            result: response.data,
            timestamp: new Date().toISOString()
          })

          // Limit history to 50 entries
          if (this.conversionHistory.length > 50) {
            this.conversionHistory = this.conversionHistory.slice(0, 50)
          }
        }

        return response
      } catch (error) {
        showError('Failed to convert value')
        throw error
      } finally {
        this.isLoadingConversion = false
      }
    },

    /**
     * Get conversion factor
     */
    async getConversionFactor(fromUnitId, toUnitId) {
      const cacheKey = `factor_${fromUnitId}_${toUnitId}`

      if (this.isValidCache(cacheKey)) {
        return this.unitsCache.get(cacheKey)
      }

      try {
        const response = await unitsService.getConversionFactor(fromUnitId, toUnitId)

        if (response.success) {
          this.unitsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to get conversion factor')
        throw error
      }
    },

    /**
     * Check if units are convertible
     */
    async areUnitsConvertible(fromUnitId, toUnitId) {
      try {
        return await unitsService.areUnitsConvertible(fromUnitId, toUnitId)
      } catch (error) {
        console.error('Failed to check convertibility:', error)
        return false
      }
    },

    /**
     * Fetch common conversions
     */
    async fetchCommonConversions(unitId, force = false) {
      if (!force && this.commonConversions.has(unitId)) {
        return this.commonConversions.get(unitId)
      }

      try {
        const response = await unitsService.getCommonConversions(unitId)

        if (response.success) {
          this.commonConversions.set(unitId, response.data)
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch common conversions')
        throw error
      }
    },

    /**
     * Fetch conversion history
     */
    async fetchConversionHistory(force = false) {
      if (!force && this.conversionHistory.length > 0) {
        return this.conversionHistory
      }

      try {
        const response = await unitsService.getConversionHistory()

        if (response.success) {
          this.conversionHistory = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch conversion history')
        throw error
      }
    },

    /**
     * Fetch favorite conversions
     */
    async fetchFavoriteConversions(force = false) {
      if (!force && this.favoriteConversions.length > 0) {
        return this.favoriteConversions
      }

      try {
        const response = await unitsService.getFavoriteConversions()

        if (response.success) {
          this.favoriteConversions = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch favorite conversions')
        throw error
      }
    },

    // === Hierarchy Operations ===

    /**
     * Fetch unit hierarchy
     */
    async fetchUnitHierarchy(unitType, force = false) {
      if (!force && this.unitHierarchy.has(unitType)) {
        return this.unitHierarchy.get(unitType)
      }

      try {
        const response = await unitsService.getUnitHierarchy(unitType)

        if (response.success) {
          this.unitHierarchy.set(unitType, response.data)
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch unit hierarchy')
        throw error
      }
    },

    /**
     * Fetch unit path
     */
    async fetchUnitPath(unitId, force = false) {
      if (!force && this.unitPaths.has(unitId)) {
        return this.unitPaths.get(unitId)
      }

      try {
        const response = await unitsService.getUnitPath(unitId)

        if (response.success) {
          this.unitPaths.set(unitId, response.data)
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch unit path')
        throw error
      }
    },

    /**
     * Validate hierarchy
     */
    async validateHierarchy(unitType) {
      this.isValidating = true

      try {
        const response = await unitsService.validateHierarchy(unitType)
        return response.data
      } catch (error) {
        showError('Failed to validate hierarchy')
        throw error
      } finally {
        this.isValidating = false
      }
    },

    // === Display Order Operations ===

    /**
     * Update display order
     */
    async updateDisplayOrder(unitId, displayOrder) {
      try {
        const response = await unitsService.updateDisplayOrder(unitId, displayOrder)

        if (response.success) {
          // Update local state
          const unit = this.units.find(u => u.recCode === unitId)
          if (unit) {
            unit.displayOrder = displayOrder
          }

          if (this.currentUnit?.recCode === unitId) {
            this.currentUnit.displayOrder = displayOrder
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
     * Reorder units in type
     */
    async reorderUnitsInType(unitType, unitIds) {
      try {
        const response = await unitsService.reorderUnitsInType(unitType, unitIds)

        if (response.success) {
          // Refresh units of this type
          await this.fetchUnitsByType(unitType, true)
          showSuccess('Units reordered successfully')
        }

        return response
      } catch (error) {
        showError('Failed to reorder units')
        throw error
      }
    },

    /**
     * Get next display order
     */
    async getNextDisplayOrder(unitType) {
      try {
        return await unitsService.getNextDisplayOrder(unitType)
      } catch (error) {
        console.error('Failed to get next display order:', error)
        return 1
      }
    },

    /**
     * Optimize display order
     */
    async optimizeDisplayOrder(unitType) {
      try {
        const response = await unitsService.optimizeDisplayOrder(unitType)

        if (response.success) {
          // Refresh units of this type
          await this.fetchUnitsByType(unitType, true)
          showSuccess('Display order optimized successfully')
        }

        return response
      } catch (error) {
        showError('Failed to optimize display order')
        throw error
      }
    },

    // === Analytics and Statistics ===

    /**
     * Fetch unit statistics
     */
    async fetchUnitStatistics(force = false) {
      const cacheKey = 'unit_statistics'

      if (!force && this.statisticsCache.has(cacheKey)) {
        return this.statisticsCache.get(cacheKey)
      }

      try {
        const response = await unitsService.getUnitStatistics()

        if (response.success) {
          this.statisticsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch unit statistics')
        throw error
      }
    },

    /**
     * Fetch units with missing information
     */
    async fetchUnitsWithMissingInfo(force = false) {
      if (!force && this.unitsWithMissingInfo.length > 0) {
        return this.unitsWithMissingInfo
      }

      try {
        const response = await unitsService.getUnitsWithMissingInfo()

        if (response.success) {
          this.unitsWithMissingInfo = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch units with missing information')
        throw error
      }
    },

    /**
     * Fetch recently added units
     */
    async fetchRecentlyAddedUnits(limit = 10, force = false) {
      if (!force && this.recentUnits.length > 0) {
        return this.recentUnits
      }

      try {
        const response = await unitsService.getRecentlyAddedUnits(limit)

        if (response.success) {
          this.recentUnits = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch recent units')
        throw error
      }
    },

    // === Validation Methods ===

    /**
     * Validate unit code uniqueness
     */
    async validateUnitCode(unitCode, excludeId = null) {
      try {
        return await unitsService.isUnitCodeUnique(unitCode, excludeId)
      } catch (error) {
        console.error('Validation failed:', error)
        return false
      }
    },

    /**
     * Validate unit name uniqueness
     */
    async validateUnitName(unitName, excludeId = null) {
      try {
        return await unitsService.isUnitNameUnique(unitName, excludeId)
      } catch (error) {
        console.error('Validation failed:', error)
        return false
      }
    },

    /**
     * Validate circular dependency
     */
    async validateCircularDependency(unitId, baseUnitId) {
      this.isValidating = true

      try {
        const response = await unitsService.validateCircularDependency(unitId, baseUnitId)
        return response.data
      } catch (error) {
        console.error('Circular dependency validation failed:', error)
        return { hasCircularDependency: false }
      } finally {
        this.isValidating = false
      }
    },

    /**
     * Validate unit data
     */
    async validateUnitData(unitId) {
      this.isValidating = true

      try {
        const response = await unitsService.validateUnitData(unitId)
        return response.data
      } catch (error) {
        showError('Failed to validate unit data')
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
        unitType: null,
        unitCategory: null,
        isSystemUnit: null,
        isBaseUnit: null,
        hasConversionFormula: null
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
      this.fetchUnits()
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
      this.unitsCache.clear()
      this.statisticsCache.clear()
      this.analyticsCache.clear()
      this.unitHierarchy.clear()
      this.unitPaths.clear()
      this.commonConversions.clear()
      this.cacheTimestamps.clear()
    },

    clearExpiredCache() {
      const now = Date.now()
      for (const [key, timestamp] of this.cacheTimestamps.entries()) {
        if (now - timestamp >= this.CACHE_TTL) {
          this.unitsCache.delete(key)
          this.statisticsCache.delete(key)
          this.analyticsCache.delete(key)
          this.unitHierarchy.delete(key)
          this.unitPaths.delete(key)
          this.commonConversions.delete(key)
          this.cacheTimestamps.delete(key)
        }
      }
    },

    /**
     * Utility methods
     */
    getUnitTypeIcon(unitType) {
      return unitsService.getUnitTypeIcon(unitType)
    },

    getUnitTypeColor(unitType) {
      return unitsService.getUnitTypeColor(unitType)
    },

    getUnitCategoryColor(unitCategory) {
      return unitsService.getUnitCategoryColor(unitCategory)
    },

    formatUnitDisplayName(unit) {
      return unitsService.formatUnitDisplayName(unit)
    },

    getBaseUnitIndicator(unit) {
      return unitsService.getBaseUnitIndicator(unit)
    },

    getSystemUnitIndicator(unit) {
      return unitsService.getSystemUnitIndicator(unit)
    },

    formatConversionFactor(factor) {
      return unitsService.formatConversionFactor(factor)
    },

    getUnitHierarchyDepth(unit) {
      return unitsService.getUnitHierarchyDepth(unit, this.units)
    },

    buildUnitHierarchyPath(unit) {
      return unitsService.buildUnitHierarchyPath(unit, this.units)
    },

    getDerivedUnitsCount(unit) {
      return unitsService.getDerivedUnitsCount(unit, this.units)
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
