/* eslint-disable no-useless-catch */
// src/services/api/units.service.js
import { api } from 'boot/axios'
import { API_ENDPOINTS, PAGINATION } from 'src/constants/api.constants'

class UnitsService {

  /**
   * Create new unit
   * @param {Object} unitData - Unit creation data
   * @returns {Promise<Object>} Created unit
   */
  async createUnit(unitData) {
    try {
      const response = await api.post(API_ENDPOINTS.UNITS.BASE, unitData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get unit by ID
   * @param {string} unitId - Unit ID
   * @returns {Promise<Object>} Unit data
   */
  async getUnitById(unitId) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.BY_ID(unitId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update unit
   * @param {string} unitId - Unit ID
   * @param {Object} unitData - Updated unit data
   * @returns {Promise<Object>} Updated unit
   */
  async updateUnit(unitId, unitData) {
    try {
      const response = await api.put(API_ENDPOINTS.UNITS.BY_ID(unitId), unitData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Delete unit
   * @param {string} unitId - Unit ID
   * @returns {Promise<void>}
   */
  async deleteUnit(unitId) {
    try {
      await api.delete(API_ENDPOINTS.UNITS.BY_ID(unitId))
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all units with pagination
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated units
   */
  async getAllUnits(params = {}) {
    try {
      const queryParams = {
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'unitName'},${params.direction || 'ASC'}`
      }

      const response = await api.get(API_ENDPOINTS.UNITS.BASE, { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Search units with filters
   * @param {string} searchTerm - Search term
   * @param {string} unitType - Unit type filter
   * @param {string} unitCategory - Unit category filter
   * @param {boolean} isSystemUnit - System unit filter
   * @param {boolean} isBaseUnit - Base unit filter
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Search results
   */
  async searchUnits(searchTerm, unitType, unitCategory, isSystemUnit, isBaseUnit, params = {}) {
    try {
      const queryParams = {
        searchTerm,
        unitType,
        unitCategory,
        isSystemUnit,
        isBaseUnit,
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'unitName'},${params.direction || 'ASC'}`
      }

      const response = await api.get(API_ENDPOINTS.UNITS.SEARCH, { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get units by type
   * @param {string} unitType - Unit type
   * @returns {Promise<Array>} Units array
   */
  async getUnitsByType(unitType) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.BY_TYPE(unitType))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get units by category
   * @param {string} unitCategory - Unit category
   * @returns {Promise<Array>} Units array
   */
  async getUnitsByCategory(unitCategory) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.BY_CATEGORY(unitCategory))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get units by type and category
   * @param {string} unitType - Unit type
   * @param {string} unitCategory - Unit category
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated units
   */
  async getUnitsByTypeAndCategory(unitType, unitCategory, params = {}) {
    try {
      const queryParams = {
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'displayOrder'},${params.direction || 'ASC'}`
      }

      const response = await api.get(API_ENDPOINTS.UNITS.BY_TYPE_AND_CATEGORY(unitType, unitCategory), { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get base units
   * @returns {Promise<Array>} Base units array
   */
  async getBaseUnits() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.BASE_UNITS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get derived units by base unit
   * @param {string} baseUnitId - Base unit ID
   * @returns {Promise<Array>} Derived units array
   */
  async getDerivedUnitsByBaseUnit(baseUnitId) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.DERIVED_BY_BASE(baseUnitId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get convertible units
   * @param {string} unitType - Unit type
   * @param {string} excludeUnitId - Unit ID to exclude
   * @returns {Promise<Array>} Convertible units array
   */
  async getConvertibleUnits(unitType, excludeUnitId = null) {
    try {
      const params = excludeUnitId ? { excludeUnitId } : {}
      const response = await api.get(API_ENDPOINTS.UNITS.CONVERTIBLE(unitType), { params })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get system units
   * @returns {Promise<Array>} System units array
   */
  async getSystemUnits() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.SYSTEM_UNITS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get user-defined units
   * @returns {Promise<Array>} User-defined units array
   */
  async getUserDefinedUnits() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.USER_DEFINED)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Mark unit as system unit
   * @param {string} unitId - Unit ID
   * @param {boolean} isSystemUnit - System unit flag
   * @returns {Promise<void>}
   */
  async markAsSystemUnit(unitId, isSystemUnit) {
    try {
      await api.put(API_ENDPOINTS.UNITS.MARK_SYSTEM(unitId), null, {
        params: { isSystemUnit }
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * Convert value between units
   * @param {Object} conversionData - Conversion data
   * @returns {Promise<Object>} Conversion result
   */
  async convertValue(conversionData) {
    try {
      const response = await api.post(API_ENDPOINTS.UNITS.CONVERT, conversionData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get conversion factor between units
   * @param {string} fromUnitId - From unit ID
   * @param {string} toUnitId - To unit ID
   * @returns {Promise<Object>} Conversion factor
   */
  async getConversionFactor(fromUnitId, toUnitId) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.CONVERSION_FACTOR, {
        params: { fromUnitId, toUnitId }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Check if units are convertible
   * @param {string} fromUnitId - From unit ID
   * @param {string} toUnitId - To unit ID
   * @returns {Promise<boolean>} Convertible flag
   */
  async areUnitsConvertible(fromUnitId, toUnitId) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.CONVERTIBLE_CHECK, {
        params: { fromUnitId, toUnitId }
      })
      return response.data.convertible
    } catch (error) {
      throw error
    }
  }

  /**
   * Update display order
   * @param {string} unitId - Unit ID
   * @param {number} displayOrder - New display order
   * @returns {Promise<Object>} Updated unit
   */
  async updateDisplayOrder(unitId, displayOrder) {
    try {
      const response = await api.put(API_ENDPOINTS.UNITS.UPDATE_DISPLAY_ORDER(unitId), null, {
        params: { displayOrder }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Reorder units in type
   * @param {string} unitType - Unit type
   * @param {Array} unitIds - Ordered unit IDs
   * @returns {Promise<Object>} Reorder result
   */
  async reorderUnitsInType(unitType, unitIds) {
    try {
      const response = await api.put(API_ENDPOINTS.UNITS.REORDER_IN_TYPE(unitType), unitIds)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get next display order for type
   * @param {string} unitType - Unit type
   * @returns {Promise<number>} Next display order
   */
  async getNextDisplayOrder(unitType) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.NEXT_DISPLAY_ORDER(unitType))
      return response.data.nextDisplayOrder
    } catch (error) {
      throw error
    }
  }

  /**
   * Optimize display order for type
   * @param {string} unitType - Unit type
   * @returns {Promise<Object>} Optimization result
   */
  async optimizeDisplayOrder(unitType) {
    try {
      const response = await api.put(API_ENDPOINTS.UNITS.OPTIMIZE_ORDER(unitType))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Bulk create units
   * @param {Array} units - Units array
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkCreateUnits(units) {
    try {
      const response = await api.post(API_ENDPOINTS.UNITS.BULK_CREATE, units)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Bulk update display order
   * @param {Array} updates - Display order updates
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkUpdateDisplayOrder(updates) {
    try {
      const response = await api.put(API_ENDPOINTS.UNITS.BULK_DISPLAY_ORDER, updates)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Bulk update conversion properties
   * @param {Array} updates - Conversion updates
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkUpdateConversionProperties(updates) {
    try {
      const response = await api.put(API_ENDPOINTS.UNITS.BULK_CONVERSION, updates)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Bulk delete units
   * @param {Array} unitIds - Unit IDs array
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkDeleteUnits(unitIds) {
    try {
      const response = await api.delete(API_ENDPOINTS.UNITS.BULK_DELETE, { data: unitIds })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get unit types
   * @returns {Promise<Array>} Unit types array
   */
  async getUnitTypes() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.TYPES)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get unit categories
   * @returns {Promise<Array>} Unit categories array
   */
  async getUnitCategories() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.CATEGORIES)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get unit symbols
   * @returns {Promise<Array>} Unit symbols array
   */
  async getUnitSymbols() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.SYMBOLS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get units grouped by type
   * @returns {Promise<Object>} Grouped units
   */
  async getUnitsGroupedByType() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.GROUPED_BY_TYPE)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get unit statistics
   * @returns {Promise<Object>} Unit statistics
   */
  async getUnitStatistics() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.STATISTICS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get analytics by type
   * @returns {Promise<Object>} Type analytics
   */
  async getAnalyticsByType() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.ANALYTICS_TYPE)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get analytics by category
   * @returns {Promise<Object>} Category analytics
   */
  async getAnalyticsByCategory() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.ANALYTICS_CATEGORY)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get conversion factors analytics
   * @returns {Promise<Object>} Conversion analytics
   */
  async getConversionAnalytics() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.ANALYTICS_CONVERSION)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get units with missing information
   * @returns {Promise<Array>} Units with missing info
   */
  async getUnitsWithMissingInfo() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.MISSING_INFO)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get units with complex conversions
   * @returns {Promise<Array>} Units with complex conversions
   */
  async getUnitsWithComplexConversions() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.COMPLEX_CONVERSIONS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get recently added units
   * @param {number} limit - Limit
   * @returns {Promise<Array>} Recent units
   */
  async getRecentlyAddedUnits(limit = 10) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.RECENT, {
        params: { limit }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get unit hierarchy for type
   * @param {string} unitType - Unit type
   * @returns {Promise<Object>} Unit hierarchy
   */
  async getUnitHierarchy(unitType) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.HIERARCHY(unitType))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get unit path
   * @param {string} unitId - Unit ID
   * @returns {Promise<Array>} Unit path
   */
  async getUnitPath(unitId) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.PATH(unitId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Validate hierarchy for type
   * @param {string} unitType - Unit type
   * @returns {Promise<Object>} Validation result
   */
  async validateHierarchy(unitType) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.VALIDATE_HIERARCHY(unitType))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Validate unit code uniqueness
   * @param {string} unitCode - Unit code
   * @param {string} excludeId - ID to exclude
   * @returns {Promise<boolean>} Uniqueness check result
   */
  async isUnitCodeUnique(unitCode, excludeId = null) {
    try {
      const params = excludeId ? { excludeId } : {}
      const response = await api.get(API_ENDPOINTS.UNITS.VALIDATE_CODE(unitCode), { params })
      return response.data.isUnique
    } catch (error) {
      throw error
    }
  }

  /**
   * Validate unit name uniqueness
   * @param {string} unitName - Unit name
   * @param {string} excludeId - ID to exclude
   * @returns {Promise<boolean>} Uniqueness check result
   */
  async isUnitNameUnique(unitName, excludeId = null) {
    try {
      const params = excludeId ? { excludeId } : {}
      const response = await api.get(API_ENDPOINTS.UNITS.VALIDATE_NAME(unitName), { params })
      return response.data.isUnique
    } catch (error) {
      throw error
    }
  }

  /**
   * Check if unit can be deleted
   * @param {string} unitId - Unit ID
   * @returns {Promise<boolean>} Can delete flag
   */
  async canDeleteUnit(unitId) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.CAN_DELETE(unitId))
      return response.data.canDelete
    } catch (error) {
      throw error
    }
  }

  /**
   * Validate circular dependency
   * @param {string} unitId - Unit ID
   * @param {string} baseUnitId - Base unit ID
   * @returns {Promise<Object>} Validation result
   */
  async validateCircularDependency(unitId, baseUnitId) {
    try {
      const response = await api.post(API_ENDPOINTS.UNITS.VALIDATE_CIRCULAR, {
        unitId,
        baseUnitId
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Validate unit data
   * @param {string} unitId - Unit ID
   * @returns {Promise<Object>} Validation result
   */
  async validateUnitData(unitId) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.VALIDATE_DATA(unitId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Export units data
   * @param {Array} unitIds - Unit IDs to export
   * @param {string} exportFormat - Export format
   * @param {boolean} includeHierarchy - Include hierarchy flag
   * @returns {Promise<Object>} Export result
   */
  async exportUnits(unitIds = null, exportFormat = 'EXCEL', includeHierarchy = true) {
    try {
      const response = await api.post(API_ENDPOINTS.UNITS.EXPORT, unitIds, {
        params: { exportFormat, includeHierarchy }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get common conversions for unit
   * @param {string} unitId - Unit ID
   * @returns {Promise<Array>} Common conversions
   */
  async getCommonConversions(unitId) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.COMMON_CONVERSIONS(unitId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get unit suggestions for type
   * @param {string} unitType - Unit type
   * @returns {Promise<Array>} Unit suggestions
   */
  async getUnitSuggestions(unitType) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.SUGGESTIONS(unitType))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get conversion history
   * @returns {Promise<Array>} Conversion history
   */
  async getConversionHistory() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.CONVERSION_HISTORY)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get favorite conversions
   * @returns {Promise<Array>} Favorite conversions
   */
  async getFavoriteConversions() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.FAVORITE_CONVERSIONS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get unit type icon
   * @param {string} unitType - Unit type
   * @returns {string} Icon name
   */
  getUnitTypeIcon(unitType) {
    const iconMap = {
      'Length': 'straighten',
      'Weight': 'monitor_weight',
      'Volume': 'local_drink',
      'Area': 'crop_free',
      'Time': 'schedule',
      'Quantity': 'tag',
      'Currency': 'monetization_on'
    }
    return iconMap[unitType] || 'category'
  }

  /**
   * Get unit type color
   * @param {string} unitType - Unit type
   * @returns {string} Color name
   */
  getUnitTypeColor(unitType) {
    const colorMap = {
      'Length': 'primary',
      'Weight': 'secondary',
      'Volume': 'accent',
      'Area': 'positive',
      'Time': 'warning',
      'Quantity': 'info',
      'Currency': 'purple'
    }
    return colorMap[unitType] || 'grey'
  }

  /**
   * Get unit category color
   * @param {string} unitCategory - Unit category
   * @returns {string} Color name
   */
  getUnitCategoryColor(unitCategory) {
    const colorMap = {
      'Metric': 'positive',
      'Imperial': 'warning',
      'Indian': 'info',
      'Custom': 'secondary'
    }
    return colorMap[unitCategory] || 'grey'
  }

  /**
   * Format unit display name
   * @param {Object} unit - Unit object
   * @returns {string} Formatted display name
   */
  formatUnitDisplayName(unit) {
    if (!unit) return ''
    if (unit.unitSymbol) {
      return `${unit.unitName} (${unit.unitSymbol})`
    }
    return unit.unitName
  }

  /**
   * Get base unit indicator
   * @param {Object} unit - Unit object
   * @returns {Object} Base unit indicator
   */
  getBaseUnitIndicator(unit) {
    if (!unit) return { isBase: false, label: '', color: 'grey' }

    const isBase = !unit.baseUnitId
    return {
      isBase,
      label: isBase ? 'Base Unit' : 'Derived Unit',
      color: isBase ? 'positive' : 'info'
    }
  }

  /**
   * Get system unit indicator
   * @param {Object} unit - Unit object
   * @returns {Object} System unit indicator
   */
  getSystemUnitIndicator(unit) {
    if (!unit) return { isSystem: false, label: '', color: 'grey' }

    const isSystem = unit.isSystemUnit
    return {
      isSystem,
      label: isSystem ? 'System Unit' : 'User Defined',
      color: isSystem ? 'primary' : 'warning'
    }
  }

  /**
   * Format conversion factor display
   * @param {number} factor - Conversion factor
   * @returns {string} Formatted factor
   */
  formatConversionFactor(factor) {
    if (!factor) return '-'
    if (factor === 1) return '1:1'

    const formatted = parseFloat(factor).toFixed(6).replace(/\.?0+$/, '')
    return formatted
  }

  /**
   * Get unit hierarchy depth
   * @param {Object} unit - Unit object
   * @param {Array} allUnits - All units array
   * @returns {number} Hierarchy depth
   */
  getUnitHierarchyDepth(unit, allUnits = []) {
    if (!unit || !unit.baseUnitId) return 0

    const baseUnit = allUnits.find(u => u.recCode === unit.baseUnitId)
    if (!baseUnit) return 1

    return 1 + this.getUnitHierarchyDepth(baseUnit, allUnits)
  }

  /**
   * Build unit hierarchy path
   * @param {Object} unit - Unit object
   * @param {Array} allUnits - All units array
   * @returns {Array} Hierarchy path
   */
  buildUnitHierarchyPath(unit, allUnits = []) {
    if (!unit) return []

    const path = [unit]
    if (unit.baseUnitId) {
      const baseUnit = allUnits.find(u => u.recCode === unit.baseUnitId)
      if (baseUnit) {
        path.unshift(...this.buildUnitHierarchyPath(baseUnit, allUnits))
      }
    }

    return path
  }

  /**
   * Get derived units count
   * @param {Object} unit - Unit object
   * @param {Array} allUnits - All units array
   * @returns {number} Derived units count
   */
  getDerivedUnitsCount(unit, allUnits = []) {
    if (!unit) return 0
    return allUnits.filter(u => u.baseUnitId === unit.recCode).length
  }
}

export default new UnitsService()
