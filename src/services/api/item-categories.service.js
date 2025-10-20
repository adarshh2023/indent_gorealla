/* eslint-disable no-useless-catch */
// src/services/api/item-categories.service.js
import { api } from 'boot/axios'
import { API_ENDPOINTS, PAGINATION } from 'src/constants/api.constants'

class ItemCategoriesService {

  /**
   * Create new item category
   * @param {Object} categoryData - Category creation data
   * @returns {Promise<Object>} Created category
   */
  async createCategory(categoryData) {
    try {
      const response = await api.post(API_ENDPOINTS.ITEM_CATEGORIES.BASE, categoryData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get category by ID
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} Category data
   */
  async getCategoryById(categoryId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.BY_ID(categoryId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update category
   * @param {string} categoryId - Category ID
   * @param {Object} categoryData - Updated category data
   * @returns {Promise<Object>} Updated category
   */
  async updateCategory(categoryId, categoryData) {
    try {
      const response = await api.put(API_ENDPOINTS.ITEM_CATEGORIES.BY_ID(categoryId), categoryData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Delete category
   * @param {string} categoryId - Category ID
   * @returns {Promise<void>}
   */
  async deleteCategory(categoryId) {
    try {
      await api.delete(API_ENDPOINTS.ITEM_CATEGORIES.BY_ID(categoryId))
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all categories with pagination
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated categories
   */
  async getAllCategories(params = {}) {
    try {
      const queryParams = {
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'displayOrder'},${params.direction || 'ASC'}`
      }

      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.BASE, { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Search categories with filters
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Search filters
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Search results
   */
  async searchCategories(searchTerm, filters = {}, params = {}) {
    try {
      const queryParams = {
        searchTerm,
        parentCategoryId: filters.parentCategoryId,
        categoryLevel: filters.categoryLevel,
        isTestingRequired: filters.isTestingRequired,
        isSampleRequired: filters.isSampleRequired,
        isQRTrackingRequired: filters.isQRTrackingRequired,
        defaultUnit: filters.defaultUnit,
        includeInactive: filters.includeInactive || false,
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'displayOrder'},${params.direction || 'ASC'}`
      }

      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.SEARCH, { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get categories by requirements
   * @param {boolean} isTestingRequired - Testing required filter
   * @param {boolean} isSampleRequired - Sample required filter
   * @param {boolean} isQRTrackingRequired - QR tracking required filter
   * @returns {Promise<Array>} Categories array
   */
  async getCategoriesByRequirements(isTestingRequired, isSampleRequired, isQRTrackingRequired) {
    try {
      const params = {
        isTestingRequired,
        isSampleRequired,
        isQRTrackingRequired
      }
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.BY_REQUIREMENTS, { params })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get categories by level
   * @param {number} categoryLevel - Category level
   * @returns {Promise<Array>} Categories array
   */
  async getCategoriesByLevel(categoryLevel) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.BY_LEVEL(categoryLevel))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get root categories
   * @returns {Promise<Array>} Root categories array
   */
  async getRootCategories() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.ROOT)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get category children
   * @param {string} categoryId - Parent category ID
   * @returns {Promise<Array>} Children categories array
   */
  async getCategoryChildren(categoryId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.CHILDREN(categoryId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get leaf categories
   * @returns {Promise<Array>} Leaf categories array
   */
  async getLeafCategories() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.LEAF)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get categories by compliance standard
   * @param {string} standard - Compliance standard
   * @returns {Promise<Array>} Categories array
   */
  async getCategoriesByComplianceStandard(standard) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.BY_COMPLIANCE(standard))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get categories by default unit
   * @param {string} unit - Default unit
   * @returns {Promise<Array>} Categories array
   */
  async getCategoriesByDefaultUnit(unit) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.BY_UNIT(unit))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get categories requiring testing
   * @returns {Promise<Array>} Categories array
   */
  async getCategoriesRequiringTesting() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.TESTING_REQUIRED)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get categories requiring samples
   * @returns {Promise<Array>} Categories array
   */
  async getCategoriesRequiringSamples() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.SAMPLE_REQUIRED)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get categories requiring QR tracking
   * @returns {Promise<Array>} Categories array
   */
  async getCategoriesRequiringQRTracking() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.QR_TRACKING_REQUIRED)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get category statistics
   * @returns {Promise<Object>} Category statistics
   */
  async getCategoryStatistics() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.STATISTICS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update display order
   * @param {string} categoryId - Category ID
   * @param {number} displayOrder - New display order
   * @returns {Promise<Object>} Updated category
   */
  async updateDisplayOrder(categoryId, displayOrder) {
    try {
      const response = await api.put(API_ENDPOINTS.ITEM_CATEGORIES.UPDATE_DISPLAY_ORDER(categoryId), null, {
        params: { displayOrder }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Batch delete categories
   * @param {Array} categoryIds - Category IDs array
   * @returns {Promise<Object>} Batch operation result
   */
  async batchDeleteCategories(categoryIds) {
    try {
      const response = await api.delete(API_ENDPOINTS.ITEM_CATEGORIES.BATCH_DELETE, { data: categoryIds })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Validate category code uniqueness
   * @param {string} categoryCode - Category code
   * @param {string} excludeId - ID to exclude
   * @returns {Promise<boolean>} Uniqueness check result
   */
  async isCategoryCodeUnique(categoryCode, excludeId = null) {
    try {
      const params = excludeId ? { excludeId } : {}
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.VALIDATE_CODE(categoryCode), { params })
      return response.data.isUnique
    } catch (error) {
      throw error
    }
  }

  /**
   * Validate category name uniqueness
   * @param {string} categoryName - Category name
   * @param {string} parentCategoryId - Parent category ID
   * @param {string} excludeId - ID to exclude
   * @returns {Promise<boolean>} Uniqueness check result
   */
  async isCategoryNameUnique(categoryName, parentCategoryId = null, excludeId = null) {
    try {
      const params = {
        categoryName,
        parentCategoryId,
        ...(excludeId && { excludeId })
      }
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.VALIDATE_NAME, { params })
      return response.data.isUnique
    } catch (error) {
      throw error
    }
  }

  /**
   * Check if category can be deleted
   * @param {string} categoryId - Category ID
   * @returns {Promise<boolean>} Can delete flag
   */
  async canDeleteCategory(categoryId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.CAN_DELETE(categoryId))
      return response.data.canDelete
    } catch (error) {
      throw error
    }
  }

  /**
   * Check if category has children
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} Children check result
   */
  async checkCategoryHasChildren(categoryId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.HAS_CHILDREN(categoryId))
      return response.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Get category type icon
   * @param {string} categoryLevel - Category level
   * @returns {string} Icon name
   */
  getCategoryLevelIcon(categoryLevel) {
    const iconMap = {
      0: 'category',
      1: 'label',
      2: 'bookmark',
      3: 'tag'
    }
    return iconMap[categoryLevel] || 'folder'
  }

  /**
   * Get category level color
   * @param {number} categoryLevel - Category level
   * @returns {string} Color name
   */
  getCategoryLevelColor(categoryLevel) {
    const colorMap = {
      0: 'primary',
      1: 'secondary',
      2: 'accent',
      3: 'positive'
    }
    return colorMap[categoryLevel] || 'grey'
  }

  /**
   * Get requirements indicator
   * @param {Object} category - Category object
   * @returns {Object} Requirements indicator
   */
  getRequirementsIndicator(category) {
    if (!category) return { count: 0, label: 'No Requirements', color: 'grey' }

    let count = 0
    const requirements = []

    if (category.isTestingRequired) {
      count++
      requirements.push('Testing')
    }
    if (category.isSampleRequired) {
      count++
      requirements.push('Samples')
    }
    if (category.isQRTrackingRequired) {
      count++
      requirements.push('QR Tracking')
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
   * Format category display name
   * @param {Object} category - Category object
   * @returns {string} Formatted display name
   */
  formatCategoryDisplayName(category) {
    if (!category) return ''
    return `${category.categoryName} (${category.categoryCode})`
  }

  /**
   * Get compliance indicator
   * @param {Object} category - Category object
   * @returns {Object} Compliance indicator
   */
  getComplianceIndicator(category) {
    if (!category) return { hasCompliance: false, label: '', color: 'grey' }

    const hasStandards = !!(category.complianceStandards && category.complianceStandards.trim())
    const hasQuality = !!(category.qualityCheckPoints && category.qualityCheckPoints.trim())
    const hasStorage = !!(category.storageRequirements && category.storageRequirements.trim())

    const count = [hasStandards, hasQuality, hasStorage].filter(Boolean).length

    if (count === 0) {
      return { hasCompliance: false, label: 'No Compliance Info', color: 'grey' }
    }

    const labels = []
    if (hasStandards) labels.push('Standards')
    if (hasQuality) labels.push('Quality')
    if (hasStorage) labels.push('Storage')

    return {
      hasCompliance: true,
      label: labels.join(', '),
      color: count >= 3 ? 'positive' : count >= 2 ? 'info' : 'warning',
      count
    }
  }

  /**
   * Get default unit options
   * @returns {Array} Unit options
   */
  getDefaultUnitOptions() {
    return [
      { label: 'Pieces (PCS)', value: 'PCS' },
      { label: 'Kilograms (KG)', value: 'KG' },
      { label: 'Grams (G)', value: 'G' },
      { label: 'Meters (M)', value: 'M' },
      { label: 'Centimeters (CM)', value: 'CM' },
      { label: 'Liters (L)', value: 'L' },
      { label: 'Milliliters (ML)', value: 'ML' },
      { label: 'Square Meters (SQM)', value: 'SQM' },
      { label: 'Cubic Meters (CBM)', value: 'CBM' },
      { label: 'Boxes (BOX)', value: 'BOX' },
      { label: 'Packets (PKT)', value: 'PKT' },
      { label: 'Rolls (ROLL)', value: 'ROLL' },
      { label: 'Sets (SET)', value: 'SET' },
      { label: 'Pairs (PAIR)', value: 'PAIR' }
    ]
  }

  /**
   * Validate category data
   * @param {Object} categoryData - Category data to validate
   * @returns {Object} Validation result
   */
  validateCategoryData(categoryData) {
    const errors = []

    if (!categoryData.categoryCode || categoryData.categoryCode.trim() === '') {
      errors.push('Category code is required')
    }

    if (!categoryData.categoryName || categoryData.categoryName.trim() === '') {
      errors.push('Category name is required')
    }

    if (categoryData.categoryCode && !/^[A-Z0-9_]+$/.test(categoryData.categoryCode)) {
      errors.push('Category code should contain only uppercase letters, numbers, and underscores')
    }

    if (categoryData.colorCode && !/^#[0-9A-Fa-f]{6}$/.test(categoryData.colorCode)) {
      errors.push('Color code must be in hex format (#RRGGBB)')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Get category statistics summary
   * @param {Array} categories - Categories array
   * @returns {Object} Statistics summary
   */
  getCategoryStatisticsSummary(categories = []) {
    const stats = {
      total: categories.length,
      testing: 0,
      samples: 0,
      qrTracking: 0,
      withCompliance: 0,
      withQuality: 0,
      withStorage: 0,
      byUnit: {}
    }

    categories.forEach(category => {
      if (category.isTestingRequired) stats.testing++
      if (category.isSampleRequired) stats.samples++
      if (category.isQRTrackingRequired) stats.qrTracking++
      if (category.complianceStandards && category.complianceStandards.trim()) stats.withCompliance++
      if (category.qualityCheckPoints && category.qualityCheckPoints.trim()) stats.withQuality++
      if (category.storageRequirements && category.storageRequirements.trim()) stats.withStorage++

      if (category.defaultUnit) {
        stats.byUnit[category.defaultUnit] = (stats.byUnit[category.defaultUnit] || 0) + 1
      }
    })

    return stats
  }
}

export default new ItemCategoriesService()
