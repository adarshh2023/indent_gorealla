/* eslint-disable no-useless-catch */
// src/services/api/items.service.js
import { api } from 'boot/axios'
import { API_ENDPOINTS, PAGINATION } from 'src/constants/api.constants'

class ItemsService {

  /**
   * Create new item
   * @param {Object} itemData - Item creation data
   * @returns {Promise<Object>} Created item
   */
  async createItem(itemData) {
    try {
      const response = await api.post(API_ENDPOINTS.ITEMS.BASE, itemData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get item by ID
   * @param {string} itemId - Item ID
   * @returns {Promise<Object>} Item data
   */
  async getItemById(itemId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.BY_ID(itemId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update item
   * @param {string} itemId - Item ID
   * @param {Object} itemData - Updated item data
   * @returns {Promise<Object>} Updated item
   */
  async updateItem(itemId, itemData) {
    try {
      const response = await api.put(API_ENDPOINTS.ITEMS.BY_ID(itemId), itemData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Delete item
   * @param {string} itemId - Item ID
   * @returns {Promise<void>}
   */
  async deleteItem(itemId) {
    try {
      await api.delete(API_ENDPOINTS.ITEMS.BY_ID(itemId))
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all items with pagination
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated items
   */
  async getAllItems(params = {}) {
    try {
      const queryParams = {
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'itemName'},${params.direction || 'ASC'}`
      }

      const response = await api.get(API_ENDPOINTS.ITEMS.BASE, { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Search items with filters
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Search filters
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Search results
   */
  async searchItems(searchTerm, filters = {}, params = {}) {
    try {
      const queryParams = {
        searchTerm,
        itemCategoryId: filters.itemCategoryId,
        baseUnitId: filters.baseUnitId,
        material: filters.material,
        grade: filters.grade,
        itemStatus: filters.itemStatus,
        isiStandard: filters.isiStandard,
        bisStandard: filters.bisStandard,
        hsnCode: filters.hsnCode,
        isTestingRequired: filters.isTestingRequired,
        isSampleRequired: filters.isSampleRequired,
        isQRTrackingRequired: filters.isQRTrackingRequired,
        isSerialNumberRequired: filters.isSerialNumberRequired,
        preferredVendorId: filters.preferredVendorId,
        minCost: filters.minCost,
        maxCost: filters.maxCost,
        minWeight: filters.minWeight,
        maxWeight: filters.maxWeight,
        color: filters.color,
        minReorderLevel: filters.minReorderLevel,
        maxReorderLevel: filters.maxReorderLevel,
        isSystemItem: filters.isSystemItem,
        includeInactive: filters.includeInactive || false,
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'itemName'},${params.direction || 'ASC'}`
      }

      const response = await api.get(API_ENDPOINTS.ITEMS.SEARCH, { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items by category
   * @param {string} categoryId - Category ID
   * @returns {Promise<Array>} Items array
   */
  async getItemsByCategory(categoryId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.BY_CATEGORY(categoryId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items by status
   * @param {string} status - Item status
   * @returns {Promise<Array>} Items array
   */
  async getItemsByStatus(status) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.BY_STATUS(status))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items by material
   * @param {string} material - Material
   * @param {string} grade - Grade (optional)
   * @returns {Promise<Array>} Items array
   */
  async getItemsByMaterial(material, grade = null) {
    try {
      const params = grade ? { grade } : {}
      const response = await api.get(API_ENDPOINTS.ITEMS.BY_MATERIAL(material), { params })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items by HSN code
   * @param {string} hsnCode - HSN code
   * @returns {Promise<Array>} Items array
   */
  async getItemsByHSNCode(hsnCode) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.BY_HSN(hsnCode))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items by vendor
   * @param {string} vendorId - Vendor ID
   * @returns {Promise<Array>} Items array
   */
  async getItemsByVendor(vendorId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.BY_VENDOR(vendorId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items requiring testing
   * @returns {Promise<Array>} Items array
   */
  async getItemsRequiringTesting() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.TESTING_REQUIRED)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items requiring samples
   * @returns {Promise<Array>} Items array
   */
  async getItemsRequiringSamples() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.SAMPLES_REQUIRED)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items requiring QR tracking
   * @returns {Promise<Array>} Items array
   */
  async getItemsRequiringQRTracking() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.QR_TRACKING_REQUIRED)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items requiring serial numbers
   * @returns {Promise<Array>} Items array
   */
  async getItemsRequiringSerialNumbers() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.SERIAL_NUMBERS_REQUIRED)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items requiring reorder
   * @returns {Promise<Array>} Items array
   */
  async getItemsRequiringReorder() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.REORDER_REQUIRED)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items by cost range
   * @param {number} minCost - Minimum cost
   * @param {number} maxCost - Maximum cost
   * @returns {Promise<Array>} Items array
   */
  async getItemsByCostRange(minCost = null, maxCost = null) {
    try {
      const params = {}
      if (minCost !== null) params.minCost = minCost
      if (maxCost !== null) params.maxCost = maxCost

      const response = await api.get(API_ENDPOINTS.ITEMS.COST_RANGE, { params })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items with missing information
   * @returns {Promise<Array>} Items array
   */
  async getItemsWithMissingInfo() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.MISSING_INFO)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get recently added items
   * @param {number} limit - Limit
   * @returns {Promise<Array>} Items array
   */
  async getRecentlyAddedItems(limit = 10) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.RECENT, {
        params: { limit }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update item metadata
   * @param {string} itemId - Item ID
   * @param {Object} metadata - Metadata object
   * @returns {Promise<void>}
   */
  async updateItemMetadata(itemId, metadata) {
    try {
      await api.put(API_ENDPOINTS.ITEMS.UPDATE_METADATA(itemId), metadata)
    } catch (error) {
      throw error
    }
  }

  /**
   * Get item metadata
   * @param {string} itemId - Item ID
   * @returns {Promise<Object>} Metadata object
   */
  async getItemMetadata(itemId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.GET_METADATA(itemId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update alternate units
   * @param {string} itemId - Item ID
   * @param {Array} alternateUnits - Alternate units array
   * @returns {Promise<void>}
   */
  async updateAlternateUnits(itemId, alternateUnits) {
    try {
      await api.put(API_ENDPOINTS.ITEMS.UPDATE_ALTERNATE_UNITS(itemId), alternateUnits)
    } catch (error) {
      throw error
    }
  }

  /**
   * Get alternate units
   * @param {string} itemId - Item ID
   * @returns {Promise<Array>} Alternate units array
   */
  async getAlternateUnits(itemId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.GET_ALTERNATE_UNITS(itemId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get item statistics
   * @returns {Promise<Object>} Item statistics
   */
  async getItemStatistics() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.STATISTICS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get item statistics by category
   * @returns {Promise<Object>} Category statistics
   */
  async getItemStatisticsByCategory() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.ANALYTICS_CATEGORY)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get item statistics by material
   * @returns {Promise<Object>} Material statistics
   */
  async getItemStatisticsByMaterial() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.ANALYTICS_MATERIAL)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get testing requirement statistics
   * @returns {Promise<Object>} Testing statistics
   */
  async getTestingRequirementStatistics() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.ANALYTICS_TESTING)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get inventory analytics
   * @returns {Promise<Object>} Inventory analytics
   */
  async getInventoryAnalytics() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.ANALYTICS_INVENTORY)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get cost analytics
   * @returns {Promise<Object>} Cost analytics
   */
  async getCostAnalytics() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.ANALYTICS_COST)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Check item code uniqueness
   * @param {string} itemCode - Item code
   * @param {string} excludeId - ID to exclude
   * @returns {Promise<boolean>} Uniqueness check result
   */
  async isItemCodeUnique(itemCode, excludeId = null) {
    try {
      const params = excludeId ? { excludeId } : {}
      const response = await api.get(API_ENDPOINTS.ITEMS.VALIDATE_CODE(itemCode), { params })
      return response.data.isUnique
    } catch (error) {
      throw error
    }
  }

  /**
   * Check if item can be deleted
   * @param {string} itemId - Item ID
   * @returns {Promise<boolean>} Can delete flag
   */
  async canDeleteItem(itemId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.CAN_DELETE(itemId))
      return response.data.canDelete
    } catch (error) {
      throw error
    }
  }

  /**
   * Generate item code
   * @returns {Promise<string>} Generated item code
   */
  async generateItemCode() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.GENERATE_CODE)
      return response.data.itemCode
    } catch (error) {
      throw error
    }
  }

  /**
   * Export items
   * @param {Array} itemIds - Item IDs to export
   * @param {string} exportFormat - Export format
   * @param {boolean} includeMetadata - Include metadata flag
   * @returns {Promise<Object>} Export result
   */
  async exportItems(itemIds = null, exportFormat = 'EXCEL', includeMetadata = true) {
    try {
      const response = await api.post(API_ENDPOINTS.ITEMS.EXPORT, itemIds, {
        params: { exportFormat, includeMetadata }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all materials
   * @returns {Promise<Array>} Materials array
   */
  async getAllMaterials() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.MATERIALS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all grades
   * @returns {Promise<Array>} Grades array
   */
  async getAllGrades() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.GRADES)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all HSN codes
   * @returns {Promise<Array>} HSN codes array
   */
  async getAllHSNCodes() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.HSN_CODES)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Validate item data
   * @param {string} itemId - Item ID
   * @returns {Promise<Object>} Validation result
   */
  async validateItemData(itemId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.VALIDATE_DATA(itemId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get item status icon
   * @param {string} status - Item status
   * @returns {string} Icon name
   */
  getItemStatusIcon(status) {
    const iconMap = {
      'Active': 'check_circle',
      'Inactive': 'radio_button_unchecked',
      'Draft': 'edit',
      'Discontinued': 'block'
    }
    return iconMap[status] || 'help'
  }

  /**
   * Get item status color
   * @param {string} status - Item status
   * @returns {string} Color name
   */
  getItemStatusColor(status) {
    const colorMap = {
      'Active': 'positive',
      'Inactive': 'grey',
      'Draft': 'warning',
      'Discontinued': 'negative'
    }
    return colorMap[status] || 'grey'
  }

  /**
   * Get requirements indicator
   * @param {Object} item - Item object
   * @returns {Object} Requirements indicator
   */
  getRequirementsIndicator(item) {
    if (!item) return { count: 0, label: 'No Requirements', color: 'grey' }

    let count = 0
    const requirements = []

    if (item.isTestingRequired) {
      count++
      requirements.push('Testing')
    }
    if (item.isSampleRequired) {
      count++
      requirements.push('Samples')
    }
    if (item.isQRTrackingRequired) {
      count++
      requirements.push('QR Tracking')
    }
    if (item.isSerialNumberRequired) {
      count++
      requirements.push('Serial Numbers')
    }

    if (count === 0) {
      return { count: 0, label: 'No Requirements', color: 'grey' }
    }

    return {
      count,
      label: requirements.join(', '),
      color: count >= 3 ? 'negative' : count >= 2 ? 'warning' : 'positive'
    }
  }

  /**
   * Format item display name
   * @param {Object} item - Item object
   * @returns {string} Formatted display name
   */
  formatItemDisplayName(item) {
    if (!item) return ''
    return item.itemCode
      ? `${item.itemName} (${item.itemCode})`
      : item.itemName
  }

  /**
   * Get cost indicator
   * @param {Object} item - Item object
   * @returns {Object} Cost indicator
   */
  getCostIndicator(item) {
    if (!item) return { hasCost: false, label: '', color: 'grey' }

    const hasEstimatedCost = !!(item.estimatedCost && item.estimatedCost > 0)
    const hasLastPurchaseRate = !!(item.lastPurchaseRate && item.lastPurchaseRate > 0)

    if (!hasEstimatedCost && !hasLastPurchaseRate) {
      return { hasCost: false, label: 'No Cost Info', color: 'grey' }
    }

    let label = ''
    if (hasEstimatedCost) {
      label += `Est: ₹${item.estimatedCost.toLocaleString()}`
    }
    if (hasLastPurchaseRate) {
      if (label) label += ' | '
      label += `Last: ₹${item.lastPurchaseRate.toLocaleString()}`
    }

    return {
      hasCost: true,
      label,
      color: hasEstimatedCost && hasLastPurchaseRate ? 'positive' : 'info'
    }
  }

  /**
   * Get inventory status indicator
   * @param {Object} item - Item object
   * @returns {Object} Inventory status
   */
  getInventoryStatusIndicator(item) {
    if (!item) return { status: 'unknown', label: 'Unknown', color: 'grey' }

    const currentStock = item.currentStock || 0
    const reorderLevel = item.reorderLevel || 0
    const safetyStock = item.safetyStock || 0

    if (currentStock <= safetyStock) {
      return { status: 'critical', label: 'Critical Stock', color: 'negative' }
    } else if (currentStock <= reorderLevel) {
      return { status: 'reorder', label: 'Reorder Required', color: 'warning' }
    } else {
      return { status: 'normal', label: 'Normal Stock', color: 'positive' }
    }
  }

  /**
   * Format physical properties
   * @param {Object} item - Item object
   * @returns {string} Formatted properties
   */
  formatPhysicalProperties(item) {
    if (!item) return ''

    const properties = []

    if (item.weight) {
      properties.push(`Weight: ${item.weight}kg`)
    }
    if (item.volume) {
      properties.push(`Volume: ${item.volume}L`)
    }
    if (item.dimensions) {
      properties.push(`Dimensions: ${item.dimensions}`)
    }

    return properties.join(' | ') || 'No physical properties'
  }

  /**
   * Get standards compliance indicator
   * @param {Object} item - Item object
   * @returns {Object} Standards indicator
   */
  getStandardsIndicator(item) {
    if (!item) return { hasStandards: false, label: '', color: 'grey' }

    const hasISI = !!(item.isiStandard && item.isiStandard.trim())
    const hasBIS = !!(item.bisStandard && item.bisStandard.trim())
    const hasOthers = !!(item.otherStandards && item.otherStandards.trim())

    const count = [hasISI, hasBIS, hasOthers].filter(Boolean).length

    if (count === 0) {
      return { hasStandards: false, label: 'No Standards', color: 'grey' }
    }

    const labels = []
    if (hasISI) labels.push('ISI')
    if (hasBIS) labels.push('BIS')
    if (hasOthers) labels.push('Others')

    return {
      hasStandards: true,
      label: labels.join(', '),
      color: count >= 2 ? 'positive' : 'info',
      count
    }
  }

  /**
   * Get vendor status
   * @param {Object} item - Item object
   * @returns {Object} Vendor status
   */
  getVendorStatus(item) {
    if (!item) return { hasVendor: false, label: 'No Vendor', color: 'grey' }

    if (item.preferredVendorName) {
      return {
        hasVendor: true,
        label: item.preferredVendorName,
        color: 'positive'
      }
    }

    return { hasVendor: false, label: 'No Preferred Vendor', color: 'warning' }
  }

  /**
   * Validate item data
   * @param {Object} itemData - Item data to validate
   * @returns {Object} Validation result
   */
  validateItemDataFE(itemData) {
    const errors = []

    if (!itemData.itemName || itemData.itemName.trim() === '') {
      errors.push('Item name is required')
    }

    if (!itemData.itemCategoryId) {
      errors.push('Item category is required')
    }

    if (!itemData.baseUnitId) {
      errors.push('Base unit is required')
    }

    if (itemData.itemCode && !/^[A-Z0-9_-]+$/i.test(itemData.itemCode)) {
      errors.push('Item code should contain only letters, numbers, hyphens, and underscores')
    }

    if (itemData.hsnCode && !/^[0-9]{4,8}$/.test(itemData.hsnCode)) {
      errors.push('HSN code should be 4-8 digits')
    }

    if (itemData.estimatedCost && itemData.estimatedCost < 0) {
      errors.push('Estimated cost cannot be negative')
    }

    if (itemData.weight && itemData.weight < 0) {
      errors.push('Weight cannot be negative')
    }

    if (itemData.volume && itemData.volume < 0) {
      errors.push('Volume cannot be negative')
    }

    if (itemData.reorderLevel && itemData.reorderLevel < 0) {
      errors.push('Reorder level cannot be negative')
    }

    if (itemData.minOrderQuantity && itemData.minOrderQuantity <= 0) {
      errors.push('Minimum order quantity must be greater than 0')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Get item statistics summary
   * @param {Array} items - Items array
   * @returns {Object} Statistics summary
   */
  getItemStatisticsSummary(items = []) {
    const stats = {
      total: items.length,
      byStatus: {},
      byCategory: {},
      testing: 0,
      samples: 0,
      qrTracking: 0,
      serialNumbers: 0,
      withCost: 0,
      withVendor: 0,
      requiresReorder: 0,
      byMaterial: {},
      avgCost: 0
    }

    let totalCost = 0
    let itemsWithCost = 0

    items.forEach(item => {
      // Count by status
      const status = item.itemStatus || 'Unknown'
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1

      // Count by category
      const category = item.itemCategoryName || 'Unknown'
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1

      // Count by material
      if (item.material) {
        stats.byMaterial[item.material] = (stats.byMaterial[item.material] || 0) + 1
      }

      // Count requirements
      if (item.isTestingRequired) stats.testing++
      if (item.isSampleRequired) stats.samples++
      if (item.isQRTrackingRequired) stats.qrTracking++
      if (item.isSerialNumberRequired) stats.serialNumbers++

      // Count items with cost
      if (item.estimatedCost && item.estimatedCost > 0) {
        stats.withCost++
        totalCost += parseFloat(item.estimatedCost)
        itemsWithCost++
      }

      // Count items with vendor
      if (item.preferredVendorId) stats.withVendor++

      // Count items requiring reorder
      if (item.requiresReorder) stats.requiresReorder++
    })

    stats.avgCost = itemsWithCost > 0 ? totalCost / itemsWithCost : 0

    return stats
  }

  /**
   * Format currency
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency symbol
   * @returns {string} Formatted currency
   */
  formatCurrency(amount, currency = '₹') {
    if (!amount || amount === 0) return 'N/A'

    const numAmount = parseFloat(amount)
    if (numAmount >= 10000000) { // 1 crore
      return `${currency}${(numAmount / 10000000).toFixed(1)}Cr`
    } else if (numAmount >= 100000) { // 1 lakh
      return `${currency}${(numAmount / 100000).toFixed(1)}L`
    } else {
      return `${currency}${numAmount.toLocaleString('en-IN')}`
    }
  }

  /**
   * Get material type icon
   * @param {string} material - Material name
   * @returns {string} Icon name
   */
  getMaterialTypeIcon(material) {
    const iconMap = {
      'Steel': 'precision_manufacturing',
      'Iron': 'hardware',
      'Aluminum': 'category',
      'Copper': 'electrical_services',
      'Plastic': 'polymer',
      'Wood': 'park',
      'Glass': 'water_drop',
      'Concrete': 'foundation'
    }
    return iconMap[material] || 'inventory'
  }
}

export default new ItemsService()
