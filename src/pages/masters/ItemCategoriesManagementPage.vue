<template>
  <q-page class="item-categories-management">
    <div class="page-container">
      <!-- Modern Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-info">
            <h4 class="page-title">Item Categories Management</h4>
            <p class="page-subtitle">Manage product categories and their requirements</p>
          </div>
          <div class="header-actions">
            <q-btn
              icon="refresh"
              label="Refresh"
              outline
              color="primary"
              @click="loadCategories"
              :loading="isLoading"
              class="refresh-btn"
            />
          </div>
        </div>
      </div>

      <!-- Filters Section -->
      <q-card flat class="filters-card">
        <q-card-section class="filters-section">
          <div class="filters-grid">
            <!-- Search -->
            <div class="filter-group search-group">
              <SearchChips
                placeholder="Search categories by name, code, description..."
                @search="handleSearch"
                @chips-updated="handleChipsUpdated"
                :max-chips="5"
                class="search-chips"
              />
            </div>

            <!-- Primary Filters -->
            <div class="filter-group">
              <q-select
                v-model="filters.isTestingRequired"
                :options="booleanOptions"
                label="Testing Required"
                filled
                dense
                emit-value
                map-options
                clearable
                @update:model-value="applyFilters"
              >
                <template v-slot:prepend>
                  <q-icon name="science" />
                </template>
              </q-select>
            </div>

            <div class="filter-group">
              <q-select
                v-model="filters.isSampleRequired"
                :options="booleanOptions"
                label="Samples Required"
                filled
                dense
                emit-value
                map-options
                clearable
                @update:model-value="applyFilters"
              >
                <template v-slot:prepend>
                  <q-icon name="inventory" />
                </template>
              </q-select>
            </div>

            <div class="filter-group">
              <q-select
                v-model="filters.isQRTrackingRequired"
                :options="booleanOptions"
                label="QR Tracking"
                filled
                dense
                emit-value
                map-options
                clearable
                @update:model-value="applyFilters"
              >
                <template v-slot:prepend>
                  <q-icon name="qr_code" />
                </template>
              </q-select>
            </div>

            <div class="filter-group">
              <q-select
                v-model="filters.defaultUnit"
                :options="unitOptions"
                label="Default Unit"
                filled
                dense
                emit-value
                map-options
                clearable
                @update:model-value="applyFilters"
              >
                <template v-slot:prepend>
                  <q-icon name="straighten" />
                </template>
              </q-select>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <q-btn
              icon="add"
              label="Add Category"
              color="positive"
              @click="showAddDialog = true"
              class="add-btn"
            />
            <q-btn
              icon="analytics"
              label="Statistics"
              color="primary"
              @click="showStatsDialog = true"
              class="stats-btn"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Selection Banner -->
      <div v-if="selectedCategories.length > 0" class="selection-banner">
        <q-banner class="selection-info" rounded>
          <template v-slot:avatar>
            <q-icon name="check_circle" color="primary" />
          </template>
          <div class="selection-text">
            {{ selectedCategories.length }} category{{ selectedCategories.length > 1 ? 's' : '' }} selected
          </div>
          <template v-slot:action>
            <q-btn
              flat
              label="Batch Delete"
              color="negative"
              icon="delete"
              @click="confirmBatchDelete"
              :disable="selectedCategories.length === 0"
            />
            <q-btn flat label="Clear" @click="clearSelection" color="primary" />
          </template>
        </q-banner>
      </div>

      <!-- Categories Table -->
      <q-card flat class="table-card">
        <q-table
          :rows="categories"
          :columns="columns"
          :loading="isLoading"
          :pagination="pagination"
          :selected="selectedCategories"
          selection="multiple"
          row-key="recCode"
          flat
          @update:selected="selectedCategories = $event"
          @request="onTableRequest"
          class="categories-table"
        >
          <!-- Header Selection -->
          <template v-slot:header-selection="scope">
            <q-checkbox v-model="scope.selected" />
          </template>

          <!-- Row Selection -->
          <template v-slot:body-selection="scope">
            <q-checkbox
              :model-value="scope.selected"
              @update:model-value="scope.selected = $event"
            />
          </template>

          <!-- Category Name & Code -->
          <template v-slot:body-cell-categoryName="props">
            <q-td :props="props">
              <div class="category-info">
                <div class="category-name">{{ props.row.categoryName }}</div>
                <div class="category-code">{{ props.row.categoryCode }}</div>
              </div>
            </q-td>
          </template>

          <!-- Requirements -->
          <template v-slot:body-cell-requirements="props">
            <q-td :props="props">
              <div class="requirements-display">
                <q-chip
                  v-if="props.row.isTestingRequired"
                  color="orange"
                  text-color="white"
                  size="sm"
                  dense
                  icon="science"
                >
                  Testing
                </q-chip>
                <q-chip
                  v-if="props.row.isSampleRequired"
                  color="purple"
                  text-color="white"
                  size="sm"
                  dense
                  icon="inventory"
                >
                  Samples
                </q-chip>
                <q-chip
                  v-if="props.row.isQRTrackingRequired"
                  color="blue"
                  text-color="white"
                  size="sm"
                  dense
                  icon="qr_code"
                >
                  QR Track
                </q-chip>
                <span v-if="!props.row.isTestingRequired && !props.row.isSampleRequired && !props.row.isQRTrackingRequired"
                      class="no-requirements">
                  No Requirements
                </span>
              </div>
            </q-td>
          </template>

          <!-- Default Unit -->
          <template v-slot:body-cell-defaultUnit="props">
            <q-td :props="props">
              <q-chip
                v-if="props.row.defaultUnit"
                color="primary"
                text-color="white"
                size="sm"
                dense
              >
                {{ props.row.defaultUnit }}
              </q-chip>
              <span v-else class="no-unit">-</span>
            </q-td>
          </template>

          <!-- Compliance Info -->
          <template v-slot:body-cell-compliance="props">
            <q-td :props="props">
              <div class="compliance-display">
                <q-chip
                  :color="getComplianceIndicator(props.row).color"
                  text-color="white"
                  size="sm"
                  dense
                  :icon="getComplianceIndicator(props.row).hasCompliance ? 'verified' : 'info'"
                >
                  {{ getComplianceIndicator(props.row).hasCompliance ? 'Has Info' : 'No Info' }}
                </q-chip>
                <q-tooltip v-if="getComplianceIndicator(props.row).hasCompliance">
                  {{ getComplianceIndicator(props.row).label }}
                </q-tooltip>
              </div>
            </q-td>
          </template>

          <!-- Display Order -->
          <template v-slot:body-cell-displayOrder="props">
            <q-td :props="props">
              <div class="display-order">
                {{ props.row.displayOrder || '-' }}
              </div>
            </q-td>
          </template>

          <!-- Actions -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <div class="action-buttons-row">
                <q-btn
                  icon="visibility"
                  size="sm"
                  flat
                  round
                  dense
                  color="primary"
                  @click="showCategoryDetails(props.row)"
                >
                  <q-tooltip>View Details</q-tooltip>
                </q-btn>
                <q-btn
                  icon="edit"
                  size="sm"
                  flat
                  round
                  dense
                  color="warning"
                  @click="editCategory(props.row)"
                >
                  <q-tooltip>Edit Category</q-tooltip>
                </q-btn>
                <q-btn
                  icon="delete"
                  size="sm"
                  flat
                  round
                  dense
                  color="negative"
                  @click="confirmDeleteCategory(props.row)"
                >
                  <q-tooltip>Delete Category</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>

          <!-- Table Footer -->
          <!-- eslint-disable-next-line vue/no-unused-vars -->
          <template v-slot:bottom="props">
            <div class="table-footer">
              <div class="footer-info">
                Showing {{ ((pagination.page - 1) * pagination.rowsPerPage) + 1 }}
                to {{ Math.min(pagination.page * pagination.rowsPerPage, pagination.rowsNumber) }}
                of {{ pagination.rowsNumber }} categories
              </div>
              <div class="footer-controls">
                <q-pagination
                  v-model="pagination.page"
                  :max="Math.ceil(pagination.rowsNumber / pagination.rowsPerPage)"
                  :max-pages="6"
                  direction-links
                  @update:model-value="onTableRequest({ pagination })"
                />
                <q-select
                  v-model="pagination.rowsPerPage"
                  :options="[25, 50, 100, 200]"
                  label="Per page"
                  dense
                  outlined
                  @update:model-value="onTableRequest({ pagination })"
                  class="rows-select"
                />
              </div>
            </div>
          </template>

          <!-- No Data -->
          <template v-slot:no-data="{ message }">
            <div class="no-data">
              <q-icon size="3em" name="category" color="grey-4" />
              <div class="no-data-text">{{ message }}</div>
            </div>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- Add Category Dialog -->
    <q-dialog v-model="showAddDialog" persistent maximized>
      <q-card class="add-category-dialog">
        <q-bar class="dialog-bar">
          <q-icon name="add" />
          <div class="bar-title">Add New Category</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section class="dialog-content">
          <q-form @submit="createCategory" class="add-form">
            <q-tabs v-model="addTab" class="text-primary add-tabs">
              <q-tab name="basic" label="Basic Info" icon="info" />
              <q-tab name="requirements" label="Requirements" icon="checklist" />
              <q-tab name="compliance" label="Compliance" icon="verified" />
            </q-tabs>

            <q-separator />

            <q-tab-panels v-model="addTab" animated class="add-panels">
              <!-- Basic Information -->
              <q-tab-panel name="basic">
                <div class="panel-content">
                  <h6 class="panel-title">Basic Category Information</h6>
                  <div class="form-grid">
                    <div class="form-group">
                      <q-input
                        v-model="addForm.categoryCode"
                        label="Category Code *"
                        filled
                        dense
                        :rules="[
                          val => !!val || 'Category code is required',
                          val => /^[A-Z0-9_]+$/.test(val) || 'Use uppercase letters, numbers, and underscores only'
                        ]"
                      />
                    </div>
                  </div>
                  <div class="form-group full-width" v-if="hasComplianceInfo(addForm)">
                    <q-banner class="compliance-preview" rounded>
                      <template v-slot:avatar>
                        <q-icon name="verified" color="positive" />
                      </template>
                      <div class="compliance-info">
                        <strong>Compliance Information Added:</strong><br>
                        This category has detailed compliance and quality information that will help ensure proper handling and storage.
                      </div>
                    </q-banner>
                  </div>
                </div>
              </q-tab-panel>
            </q-tab-panels>

            <q-separator />

            <div class="form-actions">
              <q-btn
                type="submit"
                color="positive"
                label="Create Category"
                :loading="isCreating"
                icon="add"
              />
              <q-btn
                flat
                label="Cancel"
                @click="cancelAdd"
                :disable="isCreating"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Edit Category Dialog -->
    <q-dialog v-model="showEditDialog" persistent maximized>
      <q-card class="edit-category-dialog">
        <q-bar class="dialog-bar">
          <q-icon name="edit" />
          <div class="bar-title">Edit Category - {{ editForm.categoryName }}</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section class="dialog-content">
          <q-form @submit="saveCategoryChanges" class="edit-form">
            <q-tabs v-model="editTab" class="text-primary edit-tabs">
              <q-tab name="basic" label="Basic Info" icon="info" />
              <q-tab name="requirements" label="Requirements" icon="checklist" />
              <q-tab name="compliance" label="Compliance" icon="verified" />
            </q-tabs>

            <q-separator />

            <q-tab-panels v-model="editTab" animated class="edit-panels">
              <!-- Basic Information -->
              <q-tab-panel name="basic">
                <div class="panel-content">
                  <h6 class="panel-title">Basic Category Information</h6>
                  <div class="form-grid">
                    <div class="form-group">
                      <q-input
                        v-model="editForm.categoryCode"
                        label="Category Code *"
                        filled
                        dense
                        :rules="[
                          val => !!val || 'Category code is required',
                          val => /^[A-Z0-9_]+$/.test(val) || 'Use uppercase letters, numbers, and underscores only'
                        ]"
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model="editForm.categoryName"
                        label="Category Name *"
                        filled
                        dense
                        :rules="[val => !!val || 'Category name is required']"
                      />
                    </div>

                    <div class="form-group">
                      <q-select
                        v-model="editForm.defaultUnit"
                        :options="unitOptions"
                        label="Default Unit"
                        filled
                        dense
                        emit-value
                        map-options
                        clearable
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model.number="editForm.displayOrder"
                        label="Display Order"
                        filled
                        dense
                        type="number"
                        min="1"
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model="editForm.iconName"
                        label="Icon Name"
                        filled
                        dense
                        placeholder="e.g., category, inventory, construction"
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model="editForm.colorCode"
                        label="Color Code"
                        filled
                        dense
                        placeholder="#RRGGBB"
                        :rules="[
                          val => !val || /^#[0-9A-Fa-f]{6}$/.test(val) || 'Invalid color format'
                        ]"
                      />
                    </div>

                    <div class="form-group full-width">
                      <q-input
                        v-model="editForm.categoryDescription"
                        label="Description"
                        filled
                        dense
                        type="textarea"
                        rows="3"
                        placeholder="Brief description of the category"
                      />
                    </div>
                  </div>
                </div>
              </q-tab-panel>

              <!-- Requirements -->
              <q-tab-panel name="requirements">
                <div class="panel-content">
                  <h6 class="panel-title">Category Requirements</h6>
                  <div class="form-grid">
                    <div class="form-group">
                      <q-checkbox
                        v-model="editForm.isTestingRequired"
                        label="Testing Required"
                        color="orange"
                      />
                      <div class="form-helper">
                        Items in this category require testing before use
                      </div>
                    </div>

                    <div class="form-group">
                      <q-checkbox
                        v-model="editForm.isSampleRequired"
                        label="Sample Required"
                        color="purple"
                      />
                      <div class="form-helper">
                        Samples must be collected for items in this category
                      </div>
                    </div>

                    <div class="form-group">
                      <q-checkbox
                        v-model="editForm.isQRTrackingRequired"
                        label="QR Tracking Required"
                        color="blue"
                      />
                      <div class="form-helper">
                        Items in this category require QR code tracking
                      </div>
                    </div>
                  </div>
                </div>
              </q-tab-panel>

              <!-- Compliance -->
              <q-tab-panel name="compliance">
                <div class="panel-content">
                  <h6 class="panel-title">Compliance & Quality Information</h6>
                  <div class="form-grid">
                    <div class="form-group full-width">
                      <q-input
                        v-model="editForm.complianceStandards"
                        label="Compliance Standards"
                        filled
                        dense
                        type="textarea"
                        rows="3"
                        placeholder="e.g., ISO 9001, FDA, CE marking requirements..."
                      />
                    </div>

                    <div class="form-group full-width">
                      <q-input
                        v-model="editForm.qualityCheckPoints"
                        label="Quality Check Points"
                        filled
                        dense
                        type="textarea"
                        rows="3"
                        placeholder="e.g., Visual inspection, dimension checks, functional testing..."
                      />
                    </div>

                    <div class="form-group full-width">
                      <q-input
                        v-model="editForm.storageRequirements"
                        label="Storage Requirements"
                        filled
                        dense
                        type="textarea"
                        rows="3"
                        placeholder="e.g., Temperature controlled, dry storage, hazmat requirements..."
                      />
                    </div>
                  </div>
                </div>
              </q-tab-panel>
            </q-tab-panels>

            <q-separator />

            <div class="form-actions">
              <q-btn
                type="submit"
                color="primary"
                label="Save Changes"
                :loading="isSaving"
                icon="save"
              />
              <q-btn
                flat
                label="Cancel"
                @click="cancelEdit"
                :disable="isSaving"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Category Details Modal -->
    <q-dialog v-model="showDetailsDialog" persistent>
      <q-card class="category-details-dialog">
        <q-bar class="dialog-bar">
          <q-icon name="category" />
          <div class="bar-title">{{ selectedCategory?.categoryName }}</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section class="dialog-content" v-if="selectedCategory">
          <q-tabs v-model="detailsTab" class="text-primary">
            <q-tab name="overview" label="Overview" icon="info" />
            <q-tab name="requirements" label="Requirements" icon="checklist" />
            <q-tab name="compliance" label="Compliance" icon="verified" />
          </q-tabs>

          <q-tab-panels v-model="detailsTab" animated class="details-panels">
            <q-tab-panel name="overview">
              <div class="overview-content">
                <div class="overview-stats">
                  <div class="stat-card">
                    <q-icon name="category" color="primary" size="md" />
                    <div class="stat-info">
                      <div class="stat-value">{{ selectedCategory.categoryCode }}</div>
                      <div class="stat-label">Category Code</div>
                    </div>
                  </div>

                  <div class="stat-card">
                    <q-icon name="straighten" color="secondary" size="md" />
                    <div class="stat-info">
                      <div class="stat-value">{{ selectedCategory.defaultUnit || 'No Unit' }}</div>
                      <div class="stat-label">Default Unit</div>
                    </div>
                  </div>

                  <div class="stat-card">
                    <q-icon name="sort" color="info" size="md" />
                    <div class="stat-info">
                      <div class="stat-value">{{ selectedCategory.displayOrder || '-' }}</div>
                      <div class="stat-label">Display Order</div>
                    </div>
                  </div>
                </div>

                <div class="overview-details">
                  <div class="detail-group">
                    <label>Category Code:</label>
                    <span>{{ selectedCategory.categoryCode }}</span>
                  </div>

                  <div class="detail-group">
                    <label>Category Name:</label>
                    <span>{{ selectedCategory.categoryName }}</span>
                  </div>

                  <div class="detail-group">
                    <label>Default Unit:</label>
                    <span>{{ selectedCategory.defaultUnit || '-' }}</span>
                  </div>

                  <div class="detail-group">
                    <label>Icon Name:</label>
                    <span>{{ selectedCategory.iconName || '-' }}</span>
                  </div>

                  <div class="detail-group">
                    <label>Color Code:</label>
                    <span>{{ selectedCategory.colorCode || '-' }}</span>
                  </div>

                  <div v-if="selectedCategory.categoryDescription" class="detail-group full-width">
                    <label>Description:</label>
                    <span>{{ selectedCategory.categoryDescription }}</span>
                  </div>
                </div>
              </div>
            </q-tab-panel>

            <q-tab-panel name="requirements">
              <div class="requirements-content">
                <div class="requirements-section">
                  <h6>Category Requirements</h6>
                  <div class="requirements-details">
                    <div class="requirement-item">
                      <q-icon
                        :name="selectedCategory.isTestingRequired ? 'check_circle' : 'cancel'"
                        :color="selectedCategory.isTestingRequired ? 'positive' : 'grey'"
                        size="sm"
                      />
                      <span class="requirement-label">Testing Required</span>
                    </div>
                    <div class="requirement-item">
                      <q-icon
                        :name="selectedCategory.isSampleRequired ? 'check_circle' : 'cancel'"
                        :color="selectedCategory.isSampleRequired ? 'positive' : 'grey'"
                        size="sm"
                      />
                      <span class="requirement-label">Sample Required</span>
                    </div>
                    <div class="requirement-item">
                      <q-icon
                        :name="selectedCategory.isQRTrackingRequired ? 'check_circle' : 'cancel'"
                        :color="selectedCategory.isQRTrackingRequired ? 'positive' : 'grey'"
                        size="sm"
                      />
                      <span class="requirement-label">QR Tracking Required</span>
                    </div>
                  </div>
                </div>

                <div class="requirements-summary">
                  <q-banner rounded>
                    <template v-slot:avatar>
                      <q-icon name="info" color="primary" />
                    </template>
                    This category has {{ getRequirementsCount(selectedCategory) }} active requirement(s).
                  </q-banner>
                </div>
              </div>
            </q-tab-panel>

            <q-tab-panel name="compliance">
              <div class="compliance-content">
                <div class="compliance-section">
                  <h6>Compliance Standards</h6>
                  <div class="compliance-text">
                    <p v-if="selectedCategory.complianceStandards">{{ selectedCategory.complianceStandards }}</p>
                    <p v-else class="no-info">No compliance standards specified</p>
                  </div>
                </div>

                <div class="quality-section">
                  <h6>Quality Check Points</h6>
                  <div class="quality-text">
                    <p v-if="selectedCategory.qualityCheckPoints">{{ selectedCategory.qualityCheckPoints }}</p>
                    <p v-else class="no-info">No quality check points specified</p>
                  </div>
                </div>

                <div class="storage-section">
                  <h6>Storage Requirements</h6>
                  <div class="storage-text">
                    <p v-if="selectedCategory.storageRequirements">{{ selectedCategory.storageRequirements }}</p>
                    <p v-else class="no-info">No storage requirements specified</p>
                  </div>
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Statistics Dialog -->
    <q-dialog v-model="showStatsDialog" persistent>
      <q-card class="stats-dialog">
        <q-bar class="dialog-bar">
          <q-icon name="analytics" />
          <div class="bar-title">Category Statistics</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section class="dialog-content">
          <div class="stats-content" v-if="categoryStats">
            <div class="stats-overview">
              <div class="stat-card primary">
                <q-icon name="category" size="lg" />
                <div class="stat-info">
                  <div class="stat-value">{{ categoryStats.total }}</div>
                  <div class="stat-label">Total Categories</div>
                </div>
              </div>

              <div class="stat-card testing">
                <q-icon name="science" size="lg" />
                <div class="stat-info">
                  <div class="stat-value">{{ categoryStats.testing }}</div>
                  <div class="stat-label">Testing Required</div>
                </div>
              </div>

              <div class="stat-card samples">
                <q-icon name="inventory" size="lg" />
                <div class="stat-info">
                  <div class="stat-value">{{ categoryStats.samples }}</div>
                  <div class="stat-label">Samples Required</div>
                </div>
              </div>

              <div class="stat-card qr-tracking">
                <q-icon name="qr_code" size="lg" />
                <div class="stat-info">
                  <div class="stat-value">{{ categoryStats.qrTracking }}</div>
                  <div class="stat-label">QR Tracking</div>
                </div>
              </div>
            </div>

            <div class="stats-details">
              <div class="detail-section">
                <h6>Compliance Information</h6>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">With Standards:</span>
                    <span class="detail-value">{{ categoryStats.withCompliance }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">With Quality Points:</span>
                    <span class="detail-value">{{ categoryStats.withQuality }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">With Storage Info:</span>
                    <span class="detail-value">{{ categoryStats.withStorage }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-section" v-if="Object.keys(categoryStats.byUnit).length > 0">
                <h6>By Default Unit</h6>
                <div class="unit-breakdown">
                  <div
                    v-for="(count, unit) in categoryStats.byUnit"
                    :key="unit"
                    class="unit-item"
                  >
                    <q-chip color="primary" text-color="white" size="sm">
                      {{ unit }}: {{ count }}
                    </q-chip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useItemCategoriesStore } from 'stores/item-categories'
import { showSuccess, showError } from 'src/utils/notification'
import SearchChips from 'src/components/SearchChips.vue'

export default {
  name: 'ItemCategoriesManagement',

  components: {
    SearchChips
  },

  setup() {
    const $q = useQuasar()
    const categoriesStore = useItemCategoriesStore()

    // Reactive data
    const isLoading = ref(false)
    const isCreating = ref(false)
    const isSaving = ref(false)
    const categories = ref([])
    const selectedCategories = ref([])
    const currentKeywords = ref([])

    // Filters
    const filters = ref({
      isTestingRequired: null,
      isSampleRequired: null,
      isQRTrackingRequired: null,
      defaultUnit: null,
      includeInactive: false
    })

    // Dialogs
    const showAddDialog = ref(false)
    const showEditDialog = ref(false)
    const showDetailsDialog = ref(false)
    const showStatsDialog = ref(false)
    const selectedCategory = ref(null)

    // Tabs
    const addTab = ref('basic')
    const editTab = ref('basic')
    const detailsTab = ref('overview')

    // Forms
    const addForm = ref({
      categoryCode: '',
      categoryName: '',
      categoryDescription: '',
      defaultUnit: null,
      displayOrder: null,
      iconName: '',
      colorCode: '',
      isTestingRequired: false,
      isSampleRequired: false,
      isQRTrackingRequired: false,
      complianceStandards: '',
      qualityCheckPoints: '',
      storageRequirements: ''
    })

    const editForm = ref({})
    const editCategoryId = ref(null)

    // Statistics
    const categoryStats = ref(null)

    // Utility functions
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    // Table configuration
    const pagination = ref({
      page: 1,
      rowsPerPage: 25,
      rowsNumber: 0,
      sortBy: 'displayOrder',
      descending: false
    })

    const columns = [
      {
        name: 'categoryName',
        required: true,
        label: 'Category Name',
        align: 'left',
        field: 'categoryName',
        sortable: true,
        style: 'min-width: 200px'
      },
      {
        name: 'requirements',
        align: 'left',
        label: 'Requirements',
        field: 'requirements',
        sortable: false,
        style: 'min-width: 180px'
      },
      {
        name: 'defaultUnit',
        align: 'center',
        label: 'Default Unit',
        field: 'defaultUnit',
        sortable: true
      },
      {
        name: 'compliance',
        align: 'center',
        label: 'Compliance',
        field: 'compliance',
        sortable: false
      },
      {
        name: 'displayOrder',
        align: 'center',
        label: 'Order',
        field: 'displayOrder',
        sortable: true
      },
      {
        name: 'actions',
        align: 'center',
        label: 'Actions',
        field: 'actions',
        sortable: false
      }
    ]

    // Options
    const booleanOptions = [
      { label: 'Required', value: true },
      { label: 'Not Required', value: false }
    ]

    const unitOptions = computed(() => categoriesStore.getDefaultUnitOptions())

    // Computed properties
    const getRequirementsCount = (category) => {
      if (!category) return 0
      let count = 0
      if (category.isTestingRequired) count++
      if (category.isSampleRequired) count++
      if (category.isQRTrackingRequired) count++
      return count
    }

    const getComplianceIndicator = (category) => {
      return categoriesStore.getComplianceIndicator(category)
    }

    const hasComplianceInfo = (form) => {
      return !!(form.complianceStandards || form.qualityCheckPoints || form.storageRequirements)
    }

    // Search and filter functions
    const handleSearch = async (keywords) => {
      currentKeywords.value = [...keywords]
      pagination.value.page = 1
      await loadCategories(keywords)
    }

    const handleChipsUpdated = (keywords) => {
      currentKeywords.value = [...keywords]
      pagination.value.page = 1
      loadCategories(keywords)
    }

    const applyFilters = () => {
      pagination.value.page = 1
      loadCategories(currentKeywords.value)
    }

    // Data loading functions
    const loadCategories = async (keywords = []) => {
      isLoading.value = true
      try {
        const params = {
          page: pagination.value.page - 1,
          size: pagination.value.rowsPerPage,
          sort: pagination.value.sortBy,
          direction: pagination.value.descending ? 'DESC' : 'ASC'
        }

        let response
        if (keywords.length > 0 || hasActiveFilters()) {
          // Use search with filters
          const searchTerm = keywords.join(' ')
          response = await categoriesStore.searchCategories(searchTerm, filters.value, params)
        } else {
          // Regular fetch
          response = await categoriesStore.fetchCategories(params)
        }

        if (response && response.success) {
          categories.value = response.data.content || response.data
          pagination.value.rowsNumber = response.data.totalElements || categories.value.length
        }
      } catch (error) {
        showError('Failed to load categories')
        console.error(error)
      } finally {
        isLoading.value = false
      }
    }

    const hasActiveFilters = () => {
      return !!(filters.value.isTestingRequired !== null ||
                filters.value.isSampleRequired !== null ||
                filters.value.isQRTrackingRequired !== null ||
                filters.value.defaultUnit ||
                filters.value.includeInactive)
    }

    // Table functions
    const onTableRequest = (props) => {
      pagination.value.page = props.pagination.page
      pagination.value.rowsPerPage = props.pagination.rowsPerPage
      pagination.value.sortBy = props.pagination.sortBy
      pagination.value.descending = props.pagination.descending
      pagination.value.rowsNumber = props.pagination.rowsNumber

      loadCategories(currentKeywords.value)
    }

    const clearSelection = () => {
      selectedCategories.value = []
    }

    // Add category functions
    const createCategory = async () => {
      if (!validateAddForm()) return

      isCreating.value = true
      try {
        const categoryData = {
          recCode: generateUUID(),
          categoryCode: addForm.value.categoryCode.toUpperCase(),
          categoryName: addForm.value.categoryName,
          categoryDescription: addForm.value.categoryDescription || null,
          categoryLevel: 0, // Always 0 since no hierarchy
          parentCategoryId: null, // Always null since no hierarchy
          defaultUnit: addForm.value.defaultUnit || null,
          displayOrder: addForm.value.displayOrder || null,
          iconName: addForm.value.iconName || null,
          colorCode: addForm.value.colorCode || null,
          isTestingRequired: addForm.value.isTestingRequired || false,
          isSampleRequired: addForm.value.isSampleRequired || false,
          isQRTrackingRequired: addForm.value.isQRTrackingRequired || false,
          complianceStandards: addForm.value.complianceStandards || null,
          qualityCheckPoints: addForm.value.qualityCheckPoints || null,
          storageRequirements: addForm.value.storageRequirements || null,
          activeFlag: true
        }

        const response = await categoriesStore.createCategory(categoryData)

        if (response && response.success) {
          showSuccess('Category created successfully')
          showAddDialog.value = false
          resetAddForm()
          clearSelection()
          await loadCategories(currentKeywords.value)
        }
      } catch (error) {
        showError('Failed to create category')
        console.error(error)
      } finally {
        isCreating.value = false
      }
    }

    const validateAddForm = () => {
      if (!addForm.value.categoryCode || !addForm.value.categoryName) {
        showError('Please fill in all required fields')
        return false
      }

      if (addForm.value.colorCode && !/^#[0-9A-Fa-f]{6}$/.test(addForm.value.colorCode)) {
        showError('Invalid color code format')
        return false
      }

      return true
    }

    const cancelAdd = () => {
      showAddDialog.value = false
      resetAddForm()
    }

    const resetAddForm = () => {
      addForm.value = {
        categoryCode: '',
        categoryName: '',
        categoryDescription: '',
        defaultUnit: null,
        displayOrder: null,
        iconName: '',
        colorCode: '',
        isTestingRequired: false,
        isSampleRequired: false,
        isQRTrackingRequired: false,
        complianceStandards: '',
        qualityCheckPoints: '',
        storageRequirements: ''
      }
      addTab.value = 'basic'
    }

    // Edit category functions
    const editCategory = async (category) => {
      editCategoryId.value = category.recCode
      editForm.value = {
        categoryCode: category.categoryCode,
        categoryName: category.categoryName,
        categoryDescription: category.categoryDescription || '',
        defaultUnit: category.defaultUnit || null,
        displayOrder: category.displayOrder || null,
        iconName: category.iconName || '',
        colorCode: category.colorCode || '',
        isTestingRequired: category.isTestingRequired || false,
        isSampleRequired: category.isSampleRequired || false,
        isQRTrackingRequired: category.isQRTrackingRequired || false,
        complianceStandards: category.complianceStandards || '',
        qualityCheckPoints: category.qualityCheckPoints || '',
        storageRequirements: category.storageRequirements || ''
      }

      editTab.value = 'basic'
      showEditDialog.value = true
    }

    const saveCategoryChanges = async () => {
      if (!editCategoryId.value) return

      isSaving.value = true
      try {
        const updateData = {
          categoryCode: editForm.value.categoryCode.toUpperCase(),
          categoryName: editForm.value.categoryName,
          categoryDescription: editForm.value.categoryDescription || null,
          defaultUnit: editForm.value.defaultUnit || null,
          displayOrder: editForm.value.displayOrder || null,
          iconName: editForm.value.iconName || null,
          colorCode: editForm.value.colorCode || null,
          isTestingRequired: editForm.value.isTestingRequired || false,
          isSampleRequired: editForm.value.isSampleRequired || false,
          isQRTrackingRequired: editForm.value.isQRTrackingRequired || false,
          complianceStandards: editForm.value.complianceStandards || null,
          qualityCheckPoints: editForm.value.qualityCheckPoints || null,
          storageRequirements: editForm.value.storageRequirements || null
        }

        const response = await categoriesStore.updateCategory(editCategoryId.value, updateData)

        if (response && response.success) {
          showSuccess('Category updated successfully')
          showEditDialog.value = false
          resetEditForm()
          await loadCategories(currentKeywords.value)
        }
      } catch (error) {
        showError('Failed to update category')
        console.error(error)
      } finally {
        isSaving.value = false
      }
    }

    const cancelEdit = () => {
      showEditDialog.value = false
      resetEditForm()
    }

    const resetEditForm = () => {
      editForm.value = {}
      editCategoryId.value = null
    }

    // Category actions
    const showCategoryDetails = async (category) => {
      selectedCategory.value = category
      detailsTab.value = 'overview'
      showDetailsDialog.value = true
    }

    const confirmDeleteCategory = async (category) => {
      $q.dialog({
        title: 'Delete Category',
        message: `Are you sure you want to delete the category "${category.categoryName}"?`,
        cancel: true,
        persistent: true,
        color: 'negative'
      }).onOk(async () => {
        try {
          const success = await categoriesStore.deleteCategory(category.recCode)
          if (success) {
            clearSelection()
            await loadCategories(currentKeywords.value)
          }
        } catch (error) {
          showError('Failed to delete category')
          console.error(error)
        }
      })
    }

    const confirmBatchDelete = async () => {
      if (selectedCategories.value.length === 0) return

      $q.dialog({
        title: 'Delete Categories',
        message: `Are you sure you want to delete ${selectedCategories.value.length} categories?`,
        cancel: true,
        persistent: true,
        color: 'negative'
      }).onOk(async () => {
        try {
          const categoryIds = selectedCategories.value.map(c => c.recCode)
          const response = await categoriesStore.batchDeleteCategories(categoryIds)
          if (response) {
            clearSelection()
            await loadCategories(currentKeywords.value)
          }
        } catch (error) {
          showError('Failed to delete categories')
          console.error(error)
        }
      })
    }

    // Statistics functions
    const loadStatistics = async () => {
      try {
        categoryStats.value = categoriesStore.getCategoryStatisticsSummary(categories.value)
      } catch (error) {
        console.error('Failed to load statistics:', error)
        showError('Failed to load statistics')
      }
    }

    // Watchers
    watch(showStatsDialog, async (newValue) => {
      if (newValue) {
        await loadStatistics()
      }
    })

    // Lifecycle
    onMounted(async () => {
      await loadCategories()
    })

    watch(() => filters.value, () => {
      applyFilters()
    }, { deep: true })

    return {
      // State
      isLoading,
      isCreating,
      isSaving,
      categories,
      selectedCategories,
      currentKeywords,
      filters,

      // Dialogs
      showAddDialog,
      showEditDialog,
      showDetailsDialog,
      showStatsDialog,
      selectedCategory,
      addTab,
      editTab,
      detailsTab,

      // Forms
      addForm,
      editForm,

      // Statistics
      categoryStats,

      // Table
      pagination,
      columns,

      // Options
      booleanOptions,
      unitOptions,

      // Computed
      getRequirementsCount,
      getComplianceIndicator,
      hasComplianceInfo,

      // Methods
      loadCategories,
      onTableRequest,
      clearSelection,
      handleSearch,
      handleChipsUpdated,
      applyFilters,

      // Add category
      createCategory,
      cancelAdd,
      resetAddForm,

      // Edit category
      editCategory,
      saveCategoryChanges,
      cancelEdit,
      resetEditForm,

      // Category actions
      showCategoryDetails,
      confirmDeleteCategory,
      confirmBatchDelete,

      // Statistics
      loadStatistics
    }
  }
}
</script>

<style lang="scss" scoped>
.item-categories-management {
  background-color: #fafafa;
  min-height: 100vh;
}

.page-container {
  max-width: 100%;
  padding: 24px;
}

// Modern Header
.page-header {
  margin-bottom: 32px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
  }

  .header-info {
    .page-title {
      font-size: 2rem;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #1a1a1a;
      line-height: 1.2;
    }

    .page-subtitle {
      font-size: 1rem;
      color: #6b7280;
      margin: 0;
      line-height: 1.4;
    }
  }

  .header-actions {
    .refresh-btn {
      min-width: 120px;
      border-radius: 8px;
    }
  }
}

// Filters Card
.filters-card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  border: 1px solid #e5e7eb;

  .filters-section {
    padding: 24px;
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .search-group {
    grid-column: 1 / -1;
  }

  .filter-group {
    .q-field {
      .q-field__control {
        border-radius: 8px;
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;

    .q-btn {
      border-radius: 8px;
      font-weight: 500;
    }
  }
}

// Selection Banner
.selection-banner {
  margin-bottom: 24px;

  .selection-info {
    border-radius: 12px;
    border: 1px solid #ddd6fe;
    background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%);

    .selection-text {
      font-weight: 500;
      color: #374151;
    }
  }
}

// Table Card
.table-card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;

  .categories-table {
    ::v-deep(.q-table__top) {
      padding: 16px 24px;
      border-bottom: 1px solid #f3f4f6;
    }

    ::v-deep(.q-table__bottom) {
      padding: 16px 24px;
      border-top: 1px solid #f3f4f6;
      background: #fafafa;
    }

    ::v-deep(.q-table th) {
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
      color: #6b7280;
      background: #f9fafb;
    }

    ::v-deep(.q-table td) {
      padding: 16px 12px;
      border-bottom: 1px solid #f3f4f6;
    }

    ::v-deep(.q-table tbody tr:hover) {
      background-color: #f9fafb;
    }

    // Category info styling
    .category-info {
      .category-name {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
        font-size: 14px;
      }

      .category-code {
        font-size: 12px;
        color: #6b7280;
        font-family: 'Courier New', monospace;
      }
    }

    // Requirements display
    .requirements-display {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;

      .no-requirements {
        color: #9ca3af;
        font-size: 12px;
        font-style: italic;
      }
    }

    // Unit display
    .no-unit {
      color: #9ca3af;
      font-size: 14px;
    }

    // Compliance display
    .compliance-display {
      display: flex;
      justify-content: center;
    }

    // Display order
    .display-order {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #6b7280;
      text-align: center;
    }

    // Action buttons
    .action-buttons-row {
      display: flex;
      gap: 4px;
      justify-content: center;
    }
  }

  .table-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;

    .footer-info {
      font-size: 14px;
      color: #6b7280;
    }

    .footer-controls {
      display: flex;
      align-items: center;
      gap: 16px;

      .rows-select {
        min-width: 100px;
      }
    }
  }

  .no-data {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    gap: 16px;

    .no-data-text {
      color: #6b7280;
      font-size: 16px;
    }
  }
}

// Dialog Styling
.add-category-dialog, .edit-category-dialog, .category-details-dialog, .stats-dialog {
  width: 90vw;
  max-width: 1000px;

  .dialog-bar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 16px;
    font-weight: 600;

    .bar-title {
      font-size: 1.1rem;
      font-weight: 600;
    }

    .q-btn {
      color: white;
    }
  }

  .dialog-content {
    padding: 0;
    max-height: 85vh;
    overflow-y: auto;
  }
}

// Form Styling
.add-form, .edit-form {
  .add-tabs, .edit-tabs {
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  .add-panels, .edit-panels {
    .panel-content {
      padding: 32px;

      .panel-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 24px 0;
        padding-bottom: 8px;
        border-bottom: 1px solid #e5e7eb;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 24px;

        .form-group {
          &.full-width {
            grid-column: 1 / -1;
          }

          .form-helper {
            margin-top: 8px;
            font-size: 0.75rem;
            color: #6b7280;
          }
        }
      }

      .requirements-preview {
        margin-top: 16px;

        .requirements-info {
          line-height: 1.5;
        }
      }
    }
  }

  .form-actions {
    padding: 24px 32px;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
}

// Details Modal Styling
.details-panels {
  .overview-content {
    padding: 24px;

    .overview-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 32px;

      .stat-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
        background: #f9fafb;
        border-radius: 8px;
        border: 1px solid #e5e7eb;

        .stat-info {
          .stat-value {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1f2937;
            line-height: 1.2;
          }

          .stat-label {
            font-size: 0.875rem;
            color: #6b7280;
            margin-top: 4px;
          }
        }
      }
    }

    .overview-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;

      .detail-group {
        display: flex;
        flex-direction: column;
        gap: 8px;

        &.full-width {
          grid-column: 1 / -1;
        }

        label {
          font-weight: 500;
          color: #374151;
          font-size: 0.875rem;
        }

        span {
          color: #1f2937;
        }
      }
    }
  }

  .requirements-content, .compliance-content {
    padding: 24px;

    h6 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 20px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .requirements-section, .requirements-summary {
      margin-bottom: 32px;

      .requirements-details {
        .requirement-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;

          &:last-child {
            border-bottom: none;
          }

          .requirement-label {
            font-weight: 500;
            color: #374151;
          }
        }
      }
    }

    .compliance-section, .quality-section, .storage-section {
      margin-bottom: 24px;

      .compliance-text, .quality-text, .storage-text {
        p {
          line-height: 1.6;
          color: #1f2937;
          margin: 0;

          &.no-info {
            color: #9ca3af;
            font-style: italic;
          }
        }
      }
    }
  }
}

// Statistics Dialog
.stats-dialog {
  width: 80vw;
  max-width: 900px;

  .stats-content {
    padding: 24px;

    .stats-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 32px;

      .stat-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
        border-radius: 12px;
        color: white;

        &.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        &.testing {
          background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
        }

        &.samples {
          background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
        }

        &.qr-tracking {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .stat-info {
          .stat-value {
            font-size: 2rem;
            font-weight: 700;
            line-height: 1;
          }

          .stat-label {
            font-size: 0.875rem;
            opacity: 0.9;
            margin-top: 4px;
          }
        }
      }
    }

    .stats-details {
      .detail-section {
        margin-bottom: 24px;

        h6 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 16px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;

          .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: #f9fafb;
            border-radius: 8px;
            border: 1px solid #e5e7eb;

            .detail-label {
              font-weight: 500;
              color: #374151;
            }

            .detail-value {
              font-weight: 600;
              color: #1f2937;
            }
          }
        }

        .unit-breakdown {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          .unit-item {
            .q-chip {
              font-weight: 500;
            }
          }
        }
      }
    }
  }
}

// Responsive Design
@media (max-width: 768px) {
  .page-container {
    padding: 16px;
  }

  .page-header .header-content {
    flex-direction: column;
    gap: 16px;
  }

  .filters-card .filters-grid {
    grid-template-columns: 1fr;
  }

  .add-category-dialog, .edit-category-dialog, .category-details-dialog {
    width: 95vw;
    margin: 16px;

    .panel-content {
      padding: 16px;

      .form-grid {
        grid-template-columns: 1fr;
      }
    }

    .form-actions {
      padding: 16px;
      justify-content: center;
    }
  }

  .stats-dialog {
    width: 95vw;
    margin: 16px;

    .stats-content {
      padding: 16px;

      .stats-overview {
        grid-template-columns: 1fr;
      }
    }
  }

  .table-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;

    .footer-controls {
      justify-content: space-between;
    }
  }

  .overview-stats {
    grid-template-columns: 1fr;
  }
}

// Custom scrollbar
.dialog-content::-webkit-scrollbar {
  width: 6px;
}

.dialog-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
