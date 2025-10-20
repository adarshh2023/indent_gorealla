<template>
  <q-page class="units-management">
    <div class="page-container">
      <!-- Modern Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-info">
            <h4 class="page-title">Units Management</h4>
            <p class="page-subtitle">Manage measurement units and conversions</p>
          </div>
          <div class="header-actions">
            <q-btn
              icon="refresh"
              label="Refresh"
              outline
              color="primary"
              @click="loadUnits"
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
                placeholder="Search units by name, code, symbol..."
                @search="handleSearch"
                @chips-updated="handleChipsUpdated"
                :max-chips="5"
                class="search-chips"
              />
            </div>

            <!-- Primary Filters -->
            <div class="filter-group">
              <q-select
                v-model="filters.unitType"
                :options="unitTypeOptions"
                label="Unit Type"
                filled
                dense
                emit-value
                map-options
                clearable
                @update:model-value="applyFilters"
              >
                <template v-slot:prepend>
                  <q-icon name="category" />
                </template>
              </q-select>
            </div>

            <div class="filter-group">
              <q-select
                v-model="filters.unitCategory"
                :options="unitCategoryOptions"
                label="Category"
                filled
                dense
                emit-value
                map-options
                clearable
                @update:model-value="applyFilters"
              />
            </div>

            <div class="filter-group">
              <q-select
                v-model="filters.isSystemUnit"
                :options="systemUnitOptions"
                label="System Unit"
                filled
                dense
                emit-value
                map-options
                clearable
                @update:model-value="applyFilters"
              />
            </div>

            <div class="filter-group">
              <q-select
                v-model="filters.isBaseUnit"
                :options="baseUnitOptions"
                label="Base Unit"
                filled
                dense
                emit-value
                map-options
                clearable
                @update:model-value="applyFilters"
              />
            </div>

            <div class="filter-group">
              <q-select
                v-model="filters.hasConversionFormula"
                :options="conversionFormulaOptions"
                label="Has Formula"
                filled
                dense
                emit-value
                map-options
                clearable
                @update:model-value="applyFilters"
              />
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <q-btn
              icon="add"
              label="Add Unit"
              color="positive"
              @click="showAddDialog = true"
              class="add-btn"
            />
            <q-btn
              icon="functions"
              label="Convert Units"
              color="primary"
              @click="showConversionDialog = true"
              class="convert-btn"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Selection Banner -->
      <div v-if="selectedUnits.length > 0" class="selection-banner">
        <q-banner class="selection-info" rounded>
          <template v-slot:avatar>
            <q-icon name="check_circle" color="primary" />
          </template>
          <div class="selection-text">
            {{ selectedUnits.length }} unit{{ selectedUnits.length > 1 ? 's' : '' }} selected
          </div>
          <template v-slot:action>
            <q-btn flat label="Clear" @click="clearSelection" color="primary" />
          </template>
        </q-banner>
      </div>

      <!-- Units Table -->
      <q-card flat class="table-card">
        <q-table
          :rows="units"
          :columns="columns"
          :loading="isLoading"
          :pagination="pagination"
          :selected="selectedUnits"
          selection="multiple"
          row-key="recCode"
          flat
          @update:selected="selectedUnits = $event"
          @request="onTableRequest"
          class="units-table"
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

          <!-- Unit Name & Code -->
          <template v-slot:body-cell-unitName="props">
            <q-td :props="props">
              <div class="unit-info">
                <div class="unit-name">{{ props.row.unitName }}</div>
                <div class="unit-code">{{ props.row.unitCode }}</div>
              </div>
            </q-td>
          </template>

          <!-- Unit Type -->
          <template v-slot:body-cell-unitType="props">
            <q-td :props="props">
              <q-chip
                :color="getUnitTypeColor(props.row.unitType)"
                text-color="white"
                size="sm"
                dense
                :icon="getUnitTypeIcon(props.row.unitType)"
                class="type-chip"
              >
                {{ props.row.unitType }}
              </q-chip>
            </q-td>
          </template>

          <!-- Unit Category -->
          <template v-slot:body-cell-unitCategory="props">
            <q-td :props="props">
              <q-chip
                :color="getUnitCategoryColor(props.row.unitCategory)"
                text-color="white"
                size="sm"
                dense
                class="category-chip"
              >
                {{ props.row.unitCategory }}
              </q-chip>
            </q-td>
          </template>

          <!-- Unit Symbol -->
          <template v-slot:body-cell-unitSymbol="props">
            <q-td :props="props">
              <div class="symbol-display">
                <q-badge
                  v-if="props.row.unitSymbol"
                  color="primary"
                  :label="props.row.unitSymbol"
                  class="symbol-badge"
                />
                <span v-else class="no-symbol">-</span>
              </div>
            </q-td>
          </template>

          <!-- Base Unit Info -->
          <template v-slot:body-cell-baseUnit="props">
            <q-td :props="props">
              <div class="base-unit-info">
                <q-chip
                  :color="getBaseUnitIndicator(props.row).color"
                  text-color="white"
                  size="sm"
                  dense
                  class="base-unit-chip"
                >
                  {{ getBaseUnitIndicator(props.row).label }}
                </q-chip>
                <div v-if="props.row.baseUnitName" class="base-unit-name">
                  → {{ props.row.baseUnitName }}
                </div>
              </div>
            </q-td>
          </template>

          <!-- Conversion Factor -->
          <template v-slot:body-cell-conversionFactor="props">
            <q-td :props="props">
              <div class="conversion-factor">
                <span class="factor-value">{{ formatConversionFactor(props.row.conversionFactor) }}</span>
                <q-icon
                  v-if="props.row.conversionFormula"
                  name="functions"
                  size="xs"
                  color="info"
                  class="formula-icon"
                >
                  <q-tooltip>Has conversion formula</q-tooltip>
                </q-icon>
              </div>
            </q-td>
          </template>

          <!-- System Unit -->
          <template v-slot:body-cell-isSystemUnit="props">
            <q-td :props="props">
              <q-chip
                :color="getSystemUnitIndicator(props.row).color"
                text-color="white"
                size="sm"
                dense
                class="system-chip"
              >
                {{ getSystemUnitIndicator(props.row).label }}
              </q-chip>
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
                  @click="showUnitDetails(props.row)"
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
                  @click="editUnit(props.row)"
                >
                  <q-tooltip>Edit Unit</q-tooltip>
                </q-btn>
                <q-btn
                  icon="functions"
                  size="sm"
                  flat
                  round
                  dense
                  color="info"
                  @click="showConvertFromUnit(props.row)"
                >
                  <q-tooltip>Convert From This Unit</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="!props.row.isSystemUnit"
                  icon="delete"
                  size="sm"
                  flat
                  round
                  dense
                  color="negative"
                  @click="confirmDeleteUnit(props.row)"
                >
                  <q-tooltip>Delete Unit</q-tooltip>
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
                of {{ pagination.rowsNumber }} units
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
              <q-icon size="3em" name="straighten" color="grey-4" />
              <div class="no-data-text">{{ message }}</div>
            </div>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- Add Unit Dialog -->
    <q-dialog v-model="showAddDialog" persistent maximized>
      <q-card class="add-unit-dialog">
        <q-bar class="dialog-bar">
          <q-icon name="add" />
          <div class="bar-title">Add New Unit</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section class="dialog-content">
          <q-form @submit="createUnit" class="add-form">
            <q-tabs v-model="addTab" class="text-primary add-tabs">
              <q-tab name="basic" label="Basic Info" icon="info" />
              <q-tab name="conversion" label="Conversion" icon="functions" />
              <q-tab name="display" label="Display" icon="visibility" />
            </q-tabs>

            <q-separator />

            <q-tab-panels v-model="addTab" animated class="add-panels">
              <!-- Basic Information -->
              <q-tab-panel name="basic">
                <div class="panel-content">
                  <h6 class="panel-title">Basic Unit Information</h6>
                  <div class="form-grid">
                    <div class="form-group">
                      <q-input
                        v-model="addForm.unitCode"
                        label="Unit Code *"
                        filled
                        dense
                        :rules="[
                          val => !!val || 'Unit code is required',
                          val => /^[A-Z0-9_]+$/.test(val) || 'Use uppercase letters, numbers, and underscores only'
                        ]"
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model="addForm.unitName"
                        label="Unit Name *"
                        filled
                        dense
                        :rules="[val => !!val || 'Unit name is required']"
                      />
                    </div>

                    <div class="form-group">
                      <q-select
                        v-model="addForm.unitType"
                        :options="unitTypeOptions"
                        label="Unit Type *"
                        filled
                        dense
                        emit-value
                        map-options
                        :rules="[val => !!val || 'Unit type is required']"
                        @update:model-value="onUnitTypeChange"
                      />
                    </div>

                    <div class="form-group">
                      <q-select
                        v-model="addForm.unitCategory"
                        :options="unitCategoryOptions"
                        label="Category *"
                        filled
                        dense
                        emit-value
                        map-options
                        :rules="[val => !!val || 'Unit category is required']"
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model="addForm.unitSymbol"
                        label="Unit Symbol"
                        filled
                        dense
                        placeholder="e.g., m, kg, L"
                      />
                    </div>

                    <div class="form-group full-width">
                      <q-input
                        v-model="addForm.unitDescription"
                        label="Description"
                        filled
                        dense
                        type="textarea"
                        rows="2"
                        placeholder="Brief description of the unit"
                      />
                    </div>

                    <div class="form-group">
                      <q-checkbox
                        v-model="addForm.isSystemUnit"
                        label="System Unit"
                        :disable="!canMarkAsSystemUnit"
                      />
                      <div class="form-helper">
                        {{ canMarkAsSystemUnit ? 'Check if this is a system-defined unit' : 'Only admins can create system units' }}
                      </div>
                    </div>
                  </div>
                </div>
              </q-tab-panel>

              <!-- Conversion Information -->
              <q-tab-panel name="conversion">
                <div class="panel-content">
                  <h6 class="panel-title">Conversion Properties</h6>
                  <div class="form-grid">
                    <div class="form-group">
                      <q-select
                        v-model="addForm.baseUnitId"
                        :options="availableBaseUnits"
                        label="Base Unit"
                        filled
                        dense
                        emit-value
                        map-options
                        clearable
                        @update:model-value="onBaseUnitChange"
                      />
                      <div class="form-helper">
                        Leave empty if this is a base unit for its type
                      </div>
                    </div>

                    <div v-if="addForm.baseUnitId" class="form-group">
                      <q-input
                        v-model.number="addForm.conversionFactor"
                        label="Conversion Factor *"
                        filled
                        dense
                        type="number"
                        step="any"
                        :rules="[val => val > 0 || 'Conversion factor must be positive']"
                      />
                      <div class="form-helper">
                        How many of this unit equals one base unit
                      </div>
                    </div>

                    <div v-if="addForm.baseUnitId" class="form-group full-width">
                      <q-input
                        v-model="addForm.conversionFormula"
                        label="Conversion Formula"
                        filled
                        dense
                        placeholder="e.g., (°F - 32) * 5/9 for temperature"
                      />
                      <div class="form-helper">
                        Optional formula for complex conversions
                      </div>
                    </div>

                    <div v-if="!addForm.baseUnitId" class="form-group full-width">
                      <q-banner class="info-banner" rounded>
                        <template v-slot:avatar>
                          <q-icon name="info" color="info" />
                        </template>
                        This will be a base unit for the {{ addForm.unitType }} type. Other units can be derived from this unit.
                      </q-banner>
                    </div>

                    <div v-if="addForm.baseUnitId && selectedBaseUnit" class="form-group full-width">
                      <q-banner class="conversion-preview" rounded>
                        <template v-slot:avatar>
                          <q-icon name="functions" color="primary" />
                        </template>
                        <div class="conversion-info">
                          <strong>Conversion Preview:</strong><br>
                          1 {{ selectedBaseUnit.unitName }} = {{ addForm.conversionFactor || 1 }} {{ addForm.unitName || 'units' }}
                        </div>
                      </q-banner>
                    </div>
                  </div>
                </div>
              </q-tab-panel>

              <!-- Display Properties -->
              <q-tab-panel name="display">
                <div class="panel-content">
                  <h6 class="panel-title">Display Properties</h6>
                  <div class="form-grid">
                    <div class="form-group">
                      <q-input
                        v-model.number="addForm.displayOrder"
                        label="Display Order"
                        filled
                        dense
                        type="number"
                        min="1"
                      />
                      <div class="form-helper">
                        Order in which this unit appears in lists (optional)
                      </div>
                    </div>

                    <div class="form-group">
                      <q-btn
                        outline
                        color="primary"
                        label="Get Next Order"
                        @click="getNextDisplayOrder"
                        :loading="isLoadingOrder"
                        :disable="!addForm.unitType"
                      />
                    </div>

                    <div class="form-group full-width">
                      <q-banner class="display-preview" rounded>
                        <template v-slot:avatar>
                          <q-icon name="visibility" color="primary" />
                        </template>
                        <div class="preview-info">
                          <strong>Display Preview:</strong><br>
                          {{ formatUnitDisplayName(addForm) }}
                        </div>
                      </q-banner>
                    </div>
                  </div>
                </div>
              </q-tab-panel>
            </q-tab-panels>

            <q-separator />

            <div class="form-actions">
              <q-btn
                type="submit"
                color="positive"
                label="Create Unit"
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

    <!-- Edit Unit Dialog -->
    <q-dialog v-model="showEditDialog" persistent maximized>
      <q-card class="edit-unit-dialog">
        <q-bar class="dialog-bar">
          <q-icon name="edit" />
          <div class="bar-title">Edit Unit - {{ editForm.unitName }}</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section class="dialog-content">
          <q-form @submit="saveUnitChanges" class="edit-form">
            <q-tabs v-model="editTab" class="text-primary edit-tabs">
              <q-tab name="basic" label="Basic Info" icon="info" />
              <q-tab name="conversion" label="Conversion" icon="functions" />
              <q-tab name="display" label="Display" icon="visibility" />
            </q-tabs>

            <q-separator />

            <q-tab-panels v-model="editTab" animated class="edit-panels">
              <!-- Basic Information -->
              <q-tab-panel name="basic">
                <div class="panel-content">
                  <h6 class="panel-title">Basic Unit Information</h6>
                  <div class="form-grid">
                    <div class="form-group">
                      <q-input
                        v-model="editForm.unitCode"
                        label="Unit Code *"
                        filled
                        dense
                        :rules="[
                          val => !!val || 'Unit code is required',
                          val => /^[A-Z0-9_]+$/.test(val) || 'Use uppercase letters, numbers, and underscores only'
                        ]"
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model="editForm.unitName"
                        label="Unit Name *"
                        filled
                        dense
                        :rules="[val => !!val || 'Unit name is required']"
                      />
                    </div>

                    <div class="form-group">
                      <q-select
                        v-model="editForm.unitType"
                        :options="unitTypeOptions"
                        label="Unit Type *"
                        filled
                        dense
                        emit-value
                        map-options
                        :rules="[val => !!val || 'Unit type is required']"
                        :disable="editForm.isSystemUnit"
                        @update:model-value="onEditUnitTypeChange"
                      />
                    </div>

                    <div class="form-group">
                      <q-select
                        v-model="editForm.unitCategory"
                        :options="unitCategoryOptions"
                        label="Category *"
                        filled
                        dense
                        emit-value
                        map-options
                        :rules="[val => !!val || 'Unit category is required']"
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model="editForm.unitSymbol"
                        label="Unit Symbol"
                        filled
                        dense
                        placeholder="e.g., m, kg, L"
                      />
                    </div>

                    <div class="form-group full-width">
                      <q-input
                        v-model="editForm.unitDescription"
                        label="Description"
                        filled
                        dense
                        type="textarea"
                        rows="2"
                        placeholder="Brief description of the unit"
                      />
                    </div>

                    <div class="form-group">
                      <q-checkbox
                        v-model="editForm.isSystemUnit"
                        label="System Unit"
                        :disable="!canMarkAsSystemUnit || editForm.isSystemUnit"
                      />
                      <div class="form-helper">
                        {{ editForm.isSystemUnit ? 'System units cannot be modified' : canMarkAsSystemUnit ? 'Check if this is a system-defined unit' : 'Only admins can modify system unit status' }}
                      </div>
                    </div>
                  </div>
                </div>
              </q-tab-panel>

              <!-- Conversion Information -->
              <q-tab-panel name="conversion">
                <div class="panel-content">
                  <h6 class="panel-title">Conversion Properties</h6>
                  <div class="form-grid">
                    <div class="form-group">
                      <q-select
                        v-model="editForm.baseUnitId"
                        :options="availableEditBaseUnits"
                        label="Base Unit"
                        filled
                        dense
                        emit-value
                        map-options
                        clearable
                        :disable="editForm.isSystemUnit"
                        @update:model-value="onEditBaseUnitChange"
                      />
                      <div class="form-helper">
                        Leave empty if this is a base unit for its type
                      </div>
                    </div>

                    <div v-if="editForm.baseUnitId" class="form-group">
                      <q-input
                        v-model.number="editForm.conversionFactor"
                        label="Conversion Factor *"
                        filled
                        dense
                        type="number"
                        step="any"
                        :rules="[val => val > 0 || 'Conversion factor must be positive']"
                        :disable="editForm.isSystemUnit"
                      />
                      <div class="form-helper">
                        How many of this unit equals one base unit
                      </div>
                    </div>

                    <div v-if="editForm.baseUnitId" class="form-group full-width">
                      <q-input
                        v-model="editForm.conversionFormula"
                        label="Conversion Formula"
                        filled
                        dense
                        placeholder="e.g., (°F - 32) * 5/9 for temperature"
                        :disable="editForm.isSystemUnit"
                      />
                      <div class="form-helper">
                        Optional formula for complex conversions
                      </div>
                    </div>

                    <div v-if="!editForm.baseUnitId" class="form-group full-width">
                      <q-banner class="info-banner" rounded>
                        <template v-slot:avatar>
                          <q-icon name="info" color="info" />
                        </template>
                        This is a base unit for the {{ editForm.unitType }} type. Other units can be derived from this unit.
                      </q-banner>
                    </div>

                    <div v-if="editForm.baseUnitId && selectedEditBaseUnit" class="form-group full-width">
                      <q-banner class="conversion-preview" rounded>
                        <template v-slot:avatar>
                          <q-icon name="functions" color="primary" />
                        </template>
                        <div class="conversion-info">
                          <strong>Conversion Preview:</strong><br>
                          1 {{ selectedEditBaseUnit.unitName }} = {{ editForm.conversionFactor || 1 }} {{ editForm.unitName || 'units' }}
                        </div>
                      </q-banner>
                    </div>
                  </div>
                </div>
              </q-tab-panel>

              <!-- Display Properties -->
              <q-tab-panel name="display">
                <div class="panel-content">
                  <h6 class="panel-title">Display Properties</h6>
                  <div class="form-grid">
                    <div class="form-group">
                      <q-input
                        v-model.number="editForm.displayOrder"
                        label="Display Order"
                        filled
                        dense
                        type="number"
                        min="1"
                        :disable="editForm.isSystemUnit"
                      />
                      <div class="form-helper">
                        Order in which this unit appears in lists
                      </div>
                    </div>

                    <div class="form-group full-width">
                      <q-banner class="display-preview" rounded>
                        <template v-slot:avatar>
                          <q-icon name="visibility" color="primary" />
                        </template>
                        <div class="preview-info">
                          <strong>Display Preview:</strong><br>
                          {{ formatUnitDisplayName(editForm) }}
                        </div>
                      </q-banner>
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
                :disable="editForm.isSystemUnit"
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

    <!-- Unit Conversion Dialog -->
    <q-dialog v-model="showConversionDialog" persistent>
      <q-card class="conversion-dialog">
        <q-bar class="dialog-bar">
          <q-icon name="functions" />
          <div class="bar-title">Unit Conversion</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section class="dialog-content">
          <div class="conversion-form">
            <div class="conversion-inputs">
              <div class="input-group">
                <q-input
                  v-model.number="conversionForm.value"
                  label="Value"
                  filled
                  dense
                  type="number"
                  step="any"
                  :rules="[val => val > 0 || 'Value must be positive']"
                />
              </div>

              <div class="input-group">
                <q-select
                  v-model="conversionForm.fromUnitId"
                  :options="conversionFromUnits"
                  label="From Unit"
                  filled
                  dense
                  emit-value
                  map-options
                  @update:model-value="onFromUnitChange"
                />
              </div>

              <div class="conversion-arrow">
                <q-icon name="arrow_forward" size="lg" color="primary" />
              </div>

              <div class="input-group">
                <q-select
                  v-model="conversionForm.toUnitId"
                  :options="conversionToUnits"
                  label="To Unit"
                  filled
                  dense
                  emit-value
                  map-options
                  :disable="!conversionForm.fromUnitId"
                />
              </div>

              <div class="input-group">
                <q-btn
                  color="primary"
                  icon="functions"
                  label="Convert"
                  @click="performConversion"
                  :loading="isLoadingConversion"
                  :disable="!canPerformConversion"
                />
              </div>
            </div>

            <div v-if="conversionResult" class="conversion-result">
              <q-card flat bordered class="result-card">
                <q-card-section>
                  <div class="result-content">
                    <div class="result-value">
                      {{ conversionForm.value }} {{ fromUnitDisplay }} =
                      <strong class="converted-value">{{ conversionResult.convertedValue }}</strong>
                      {{ toUnitDisplay }}
                    </div>
                    <div v-if="conversionResult.conversionFactor" class="result-factor">
                      Conversion Factor: {{ conversionResult.conversionFactor }}
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <div v-if="conversionError" class="conversion-error">
              <q-banner class="error-banner" rounded>
                <template v-slot:avatar>
                  <q-icon name="error" color="negative" />
                </template>
                {{ conversionError }}
              </q-banner>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Unit Details Modal -->
    <q-dialog v-model="showDetailsDialog" persistent>
      <q-card class="unit-details-dialog">
        <q-bar class="dialog-bar">
          <q-icon name="straighten" />
          <div class="bar-title">{{ selectedUnit?.unitName }}</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section class="dialog-content" v-if="selectedUnit">
          <q-tabs v-model="detailsTab" class="text-primary">
            <q-tab name="overview" label="Overview" icon="info" />
            <q-tab name="conversion" label="Conversion" icon="functions" />
            <q-tab name="hierarchy" label="Hierarchy" icon="account_tree" />
          </q-tabs>

          <q-tab-panels v-model="detailsTab" animated class="details-panels">
            <q-tab-panel name="overview">
              <div class="overview-content">
                <div class="overview-stats">
                  <div class="stat-card">
                    <q-icon :name="getUnitTypeIcon(selectedUnit.unitType)" color="primary" size="md" />
                    <div class="stat-info">
                      <div class="stat-value">{{ selectedUnit.unitType }}</div>
                      <div class="stat-label">Unit Type</div>
                    </div>
                  </div>

                  <div class="stat-card">
                    <q-icon name="category" color="secondary" size="md" />
                    <div class="stat-info">
                      <div class="stat-value">{{ selectedUnit.unitCategory }}</div>
                      <div class="stat-label">Category</div>
                    </div>
                  </div>

                  <div class="stat-card">
                    <q-icon name="sort" color="info" size="md" />
                    <div class="stat-info">
                      <div class="stat-value">{{ selectedUnit.displayOrder || '-' }}</div>
                      <div class="stat-label">Display Order</div>
                    </div>
                  </div>
                </div>

                <div class="overview-details">
                  <div class="detail-group">
                    <label>Unit Code:</label>
                    <span>{{ selectedUnit.unitCode }}</span>
                  </div>

                  <div class="detail-group">
                    <label>Unit Name:</label>
                    <span>{{ selectedUnit.unitName }}</span>
                  </div>

                  <div class="detail-group">
                    <label>Symbol:</label>
                    <q-badge
                      v-if="selectedUnit.unitSymbol"
                      color="primary"
                      :label="selectedUnit.unitSymbol"
                    />
                    <span v-else>-</span>
                  </div>

                  <div class="detail-group">
                    <label>System Unit:</label>
                    <q-chip
                      :color="getSystemUnitIndicator(selectedUnit).color"
                      text-color="white"
                      size="sm"
                      dense
                    >
                      {{ getSystemUnitIndicator(selectedUnit).label }}
                    </q-chip>
                  </div>

                  <div class="detail-group">
                    <label>Base Unit:</label>
                    <q-chip
                      :color="getBaseUnitIndicator(selectedUnit).color"
                      text-color="white"
                      size="sm"
                      dense
                    >
                      {{ getBaseUnitIndicator(selectedUnit).label }}
                    </q-chip>
                  </div>

                  <div v-if="selectedUnit.unitDescription" class="detail-group full-width">
                    <label>Description:</label>
                    <span>{{ selectedUnit.unitDescription }}</span>
                  </div>
                </div>
              </div>
            </q-tab-panel>

            <q-tab-panel name="conversion">
              <div class="conversion-content">
                <div class="conversion-section">
                  <h6>Conversion Properties</h6>
                  <div class="conversion-details">
                    <div class="detail-row">
                      <label>Base Unit:</label>
                      <span>{{ selectedUnit.baseUnitName || 'This is a base unit' }}</span>
                    </div>
                    <div class="detail-row">
                      <label>Conversion Factor:</label>
                      <span>{{ formatConversionFactor(selectedUnit.conversionFactor) }}</span>
                    </div>
                    <div v-if="selectedUnit.conversionFormula" class="detail-row">
                      <label>Conversion Formula:</label>
                      <code class="formula-code">{{ selectedUnit.conversionFormula }}</code>
                    </div>
                  </div>
                </div>

                <div v-if="!selectedUnit.baseUnitId && derivedUnitsCount > 0" class="derived-section">
                  <h6>Derived Units</h6>
                  <div class="derived-info">
                    <q-banner rounded>
                      <template v-slot:avatar>
                        <q-icon name="account_tree" color="primary" />
                      </template>
                      This base unit has {{ derivedUnitsCount }} derived unit{{ derivedUnitsCount > 1 ? 's' : '' }}.
                    </q-banner>
                  </div>
                </div>
              </div>
            </q-tab-panel>

            <q-tab-panel name="hierarchy">
              <div class="hierarchy-content">
                <div v-if="unitHierarchyPath.length > 0" class="hierarchy-section">
                  <h6>Unit Hierarchy Path</h6>
                  <div class="hierarchy-path">
                    <div
                      v-for="(pathUnit, index) in unitHierarchyPath"
                      :key="pathUnit.recCode"
                      class="path-item"
                    >
                      <q-chip
                        :color="pathUnit.recCode === selectedUnit.recCode ? 'primary' : 'grey'"
                        :text-color="pathUnit.recCode === selectedUnit.recCode ? 'white' : 'dark'"
                        size="md"
                      >
                        {{ pathUnit.unitName }}
                      </q-chip>
                      <q-icon
                        v-if="index < unitHierarchyPath.length - 1"
                        name="arrow_forward"
                        size="sm"
                        color="grey"
                        class="path-arrow"
                      />
                    </div>
                  </div>
                </div>

                <div class="hierarchy-info">
                  <div class="info-row">
                    <label>Hierarchy Depth:</label>
                    <span>{{ unitHierarchyDepth }}</span>
                  </div>
                  <div class="info-row">
                    <label>Derived Units:</label>
                    <span>{{ derivedUnitsCount }}</span>
                  </div>
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useUnitsStore } from 'stores/units'
import { showSuccess, showError } from 'src/utils/notification'
import SearchChips from 'src/components/SearchChips.vue'

export default {
  name: 'UnitsManagement',

  components: {
    SearchChips
  },

  setup() {
    const $q = useQuasar()
    const unitsStore = useUnitsStore()

    // Reactive data
    const isLoading = ref(false)
    const isCreating = ref(false)
    const isSaving = ref(false)
    const isLoadingOrder = ref(false)
    const isLoadingConversion = ref(false)
    const units = ref([])
    const selectedUnits = ref([])
    const currentKeywords = ref([])

    // Filters
    const filters = ref({
      unitType: null,
      unitCategory: null,
      isSystemUnit: null,
      isBaseUnit: null,
      hasConversionFormula: null
    })

    // Dialogs
    const showAddDialog = ref(false)
    const showEditDialog = ref(false)
    const showDetailsDialog = ref(false)
    const showConversionDialog = ref(false)
    const selectedUnit = ref(null)

    // Tabs
    const addTab = ref('basic')
    const editTab = ref('basic')
    const detailsTab = ref('overview')

    // Forms
    const addForm = ref({
      unitCode: '',
      unitName: '',
      unitType: null,
      unitCategory: null,
      unitSymbol: '',
      unitDescription: '',
      baseUnitId: null,
      conversionFactor: 1,
      conversionFormula: '',
      isSystemUnit: false,
      displayOrder: null
    })

    const editForm = ref({})
    const editUnitId = ref(null)

    // Conversion form
    const conversionForm = ref({
      value: 1,
      fromUnitId: null,
      toUnitId: null
    })
    const conversionResult = ref(null)
    const conversionError = ref('')

    // Base units for dropdowns
    const availableBaseUnits = ref([])
    const availableEditBaseUnits = ref([])
    const selectedBaseUnit = ref(null)
    const selectedEditBaseUnit = ref(null)

    // Conversion units
    const conversionFromUnits = ref([])
    const conversionToUnits = ref([])

    // Hierarchy data
    const unitHierarchyPath = ref([])
    const unitHierarchyDepth = ref(0)
    const derivedUnitsCount = ref(0)

    // User permissions
    const canMarkAsSystemUnit = ref(false) // This would be set based on user role

    // Table configuration
    const pagination = ref({
      page: 1,
      rowsPerPage: 25,
      rowsNumber: 0,
      sortBy: 'unitName',
      descending: false
    })

    const columns = [
      {
        name: 'unitName',
        required: true,
        label: 'Unit Name',
        align: 'left',
        field: 'unitName',
        sortable: true,
        style: 'min-width: 180px'
      },
      {
        name: 'unitType',
        align: 'center',
        label: 'Type',
        field: 'unitType',
        sortable: true
      },
      {
        name: 'unitCategory',
        align: 'center',
        label: 'Category',
        field: 'unitCategory',
        sortable: true
      },
      {
        name: 'unitSymbol',
        align: 'center',
        label: 'Symbol',
        field: 'unitSymbol',
        sortable: true
      },
      {
        name: 'baseUnit',
        align: 'left',
        label: 'Base Unit',
        field: 'baseUnit',
        sortable: false
      },
      {
        name: 'conversionFactor',
        align: 'center',
        label: 'Factor',
        field: 'conversionFactor',
        sortable: true
      },
      {
        name: 'isSystemUnit',
        align: 'center',
        label: 'System',
        field: 'isSystemUnit',
        sortable: true
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
    const unitTypeOptions = [
      { label: 'Length', value: 'Length' },
      { label: 'Weight', value: 'Weight' },
      { label: 'Volume', value: 'Volume' },
      { label: 'Area', value: 'Area' },
      { label: 'Time', value: 'Time' },
      { label: 'Quantity', value: 'Quantity' },
      { label: 'Currency', value: 'Currency' }
    ]

    const unitCategoryOptions = [
      { label: 'Metric', value: 'Metric' },
      { label: 'Imperial', value: 'Imperial' },
      { label: 'Indian', value: 'Indian' },
      { label: 'Custom', value: 'Custom' }
    ]

    const systemUnitOptions = [
      { label: 'System Units', value: true },
      { label: 'User Defined', value: false }
    ]

    const baseUnitOptions = [
      { label: 'Base Units', value: true },
      { label: 'Derived Units', value: false }
    ]

    const conversionFormulaOptions = [
      { label: 'Has Formula', value: true },
      { label: 'No Formula', value: false }
    ]

    // Computed properties
    const canPerformConversion = computed(() => {
      return conversionForm.value.value > 0 &&
             conversionForm.value.fromUnitId &&
             conversionForm.value.toUnitId &&
             conversionForm.value.fromUnitId !== conversionForm.value.toUnitId
    })

    const fromUnitDisplay = computed(() => {
      if (!conversionForm.value.fromUnitId) return ''
      const unit = conversionFromUnits.value.find(u => u.value === conversionForm.value.fromUnitId)
      return unit?.unitSymbol || unit?.unitName || ''
    })

    const toUnitDisplay = computed(() => {
      if (!conversionForm.value.toUnitId) return ''
      const unit = conversionToUnits.value.find(u => u.value === conversionForm.value.toUnitId)
      return unit?.unitSymbol || unit?.unitName || ''
    })

    // Utility functions
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    // Search and filter functions
    const handleSearch = async (keywords) => {
      currentKeywords.value = [...keywords]
      pagination.value.page = 1
      await loadUnits(keywords)
    }

    const handleChipsUpdated = (keywords) => {
      currentKeywords.value = [...keywords]
      pagination.value.page = 1
      loadUnits(keywords)
    }

    const applyFilters = () => {
      pagination.value.page = 1
      loadUnits(currentKeywords.value)
    }

    // Data loading functions
    const loadUnits = async (keywords = []) => {
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
          response = await unitsStore.searchUnits(
            searchTerm,
            filters.value.unitType,
            filters.value.unitCategory,
            filters.value.isSystemUnit,
            filters.value.isBaseUnit,
            params
          )
        } else {
          // Regular fetch
          response = await unitsStore.fetchUnits(params)
        }

        if (response && response.success) {
          units.value = response.data.content || response.data
          pagination.value.rowsNumber = response.data.totalElements || units.value.length
        }
      } catch (error) {
        showError('Failed to load units')
        console.error(error)
      } finally {
        isLoading.value = false
      }
    }

    const hasActiveFilters = () => {
      return !!(filters.value.unitType ||
                filters.value.unitCategory ||
                filters.value.isSystemUnit !== null ||
                filters.value.isBaseUnit !== null ||
                filters.value.hasConversionFormula !== null)
    }

    // Table functions
    const onTableRequest = (props) => {
      pagination.value.page = props.pagination.page
      pagination.value.rowsPerPage = props.pagination.rowsPerPage
      pagination.value.sortBy = props.pagination.sortBy
      pagination.value.descending = props.pagination.descending
      pagination.value.rowsNumber = props.pagination.rowsNumber

      loadUnits(currentKeywords.value)
    }

    const clearSelection = () => {
      selectedUnits.value = []
    }

    // Unit display functions
    const getUnitTypeIcon = (unitType) => {
      return unitsStore.getUnitTypeIcon(unitType)
    }

    const getUnitTypeColor = (unitType) => {
      return unitsStore.getUnitTypeColor(unitType)
    }

    const getUnitCategoryColor = (unitCategory) => {
      return unitsStore.getUnitCategoryColor(unitCategory)
    }

    const getBaseUnitIndicator = (unit) => {
      return unitsStore.getBaseUnitIndicator(unit)
    }

    const getSystemUnitIndicator = (unit) => {
      return unitsStore.getSystemUnitIndicator(unit)
    }

    const formatConversionFactor = (factor) => {
      return unitsStore.formatConversionFactor(factor)
    }

    const formatUnitDisplayName = (unit) => {
      return unitsStore.formatUnitDisplayName(unit)
    }

    // Add unit functions
    const onUnitTypeChange = async () => {
      console.log('Change')
      if (addForm.value.unitType) {
        // Load base units for this type
        await loadBaseUnitsForType(addForm.value.unitType, 'add')
        // Get next display order
        await getNextDisplayOrder()
      }
    }

    const onBaseUnitChange = () => {
      if (addForm.value.baseUnitId) {
        selectedBaseUnit.value = availableBaseUnits.value.find(u => u.value === addForm.value.baseUnitId)
        if (!addForm.value.conversionFactor) {
          addForm.value.conversionFactor = 1
        }
      } else {
        selectedBaseUnit.value = null
        addForm.value.conversionFactor = 1
        addForm.value.conversionFormula = ''
      }
    }

    const loadBaseUnitsForType = async (unitType, formType = 'add') => {
      try {
        const response = await unitsStore.fetchUnitsByType(unitType)
        const baseUnits = response.filter(unit => !unit.baseUnitId)

        const options = baseUnits.map(unit => ({
          label: formatUnitDisplayName(unit),
          value: unit.recCode,
          ...unit
        }))

        if (formType === 'add') {
          availableBaseUnits.value = options
        } else {
          // For edit, exclude the current unit to prevent self-reference
          availableEditBaseUnits.value = options.filter(u => u.value !== editUnitId.value)
        }
      } catch (error) {
        console.error('Failed to load base units:', error)
        if (formType === 'add') {
          availableBaseUnits.value = []
        } else {
          availableEditBaseUnits.value = []
        }
      }
    }

    const getNextDisplayOrder = async () => {
      if (!addForm.value.unitType) return

      isLoadingOrder.value = true
      try {
        const nextOrder = await unitsStore.getNextDisplayOrder(addForm.value.unitType)
        addForm.value.displayOrder = nextOrder
      } catch (error) {
        console.error('Failed to get next display order:', error)
      } finally {
        isLoadingOrder.value = false
      }
    }

    const createUnit = async () => {
      if (!validateAddForm()) return

      isCreating.value = true
      try {
        const unitData = {
          recCode: generateUUID(),
          unitCode: addForm.value.unitCode.toUpperCase(),
          unitName: addForm.value.unitName,
          unitType: addForm.value.unitType,
          unitCategory: addForm.value.unitCategory,
          unitSymbol: addForm.value.unitSymbol || null,
          unitDescription: addForm.value.unitDescription || null,
          baseUnitId: addForm.value.baseUnitId || null,
          conversionFactor: addForm.value.baseUnitId ? (addForm.value.conversionFactor || 1) : 1,
          conversionFormula: addForm.value.conversionFormula || null,
          isSystemUnit: addForm.value.isSystemUnit || false,
          displayOrder: addForm.value.displayOrder || null,
          activeFlag: true
        }

        const response = await unitsStore.createUnit(unitData)

        if (response && response.success) {
          showSuccess('Unit created successfully')
          showAddDialog.value = false
          resetAddForm()
          clearSelection()
          await loadUnits(currentKeywords.value)
        }
      } catch (error) {
        showError('Failed to create unit')
        console.error(error)
      } finally {
        isCreating.value = false
      }
    }

    const validateAddForm = () => {
      // Basic validation
      if (!addForm.value.unitCode || !addForm.value.unitName || !addForm.value.unitType || !addForm.value.unitCategory) {
        showError('Please fill in all required fields')
        return false
      }

      // Conversion validation
      if (addForm.value.baseUnitId && (!addForm.value.conversionFactor || addForm.value.conversionFactor <= 0)) {
        showError('Conversion factor must be a positive number')
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
        unitCode: '',
        unitName: '',
        unitType: null,
        unitCategory: null,
        unitSymbol: '',
        unitDescription: '',
        baseUnitId: null,
        conversionFactor: 1,
        conversionFormula: '',
        isSystemUnit: false,
        displayOrder: null
      }
      addTab.value = 'basic'
      availableBaseUnits.value = []
      selectedBaseUnit.value = null
    }

    // Edit unit functions
    const onEditUnitTypeChange = async () => {
      if (editForm.value.unitType) {
        // Load base units for this type
        await loadBaseUnitsForType(editForm.value.unitType, 'edit')
      }
    }

    const onEditBaseUnitChange = () => {
      if (editForm.value.baseUnitId) {
        selectedEditBaseUnit.value = availableEditBaseUnits.value.find(u => u.value === editForm.value.baseUnitId)
        if (!editForm.value.conversionFactor) {
          editForm.value.conversionFactor = 1
        }
      } else {
        selectedEditBaseUnit.value = null
        editForm.value.conversionFactor = 1
        editForm.value.conversionFormula = ''
      }
    }

    const editUnit = async (unit) => {
      editUnitId.value = unit.recCode
      editForm.value = {
        unitCode: unit.unitCode,
        unitName: unit.unitName,
        unitType: unit.unitType,
        unitCategory: unit.unitCategory,
        unitSymbol: unit.unitSymbol || '',
        unitDescription: unit.unitDescription || '',
        baseUnitId: unit.baseUnitId || null,
        conversionFactor: unit.conversionFactor || 1,
        conversionFormula: unit.conversionFormula || '',
        isSystemUnit: unit.isSystemUnit || false,
        displayOrder: unit.displayOrder || null
      }

      // Load base units for this type
      await loadBaseUnitsForType(unit.unitType, 'edit')

      // Set selected base unit
      if (editForm.value.baseUnitId) {
        selectedEditBaseUnit.value = availableEditBaseUnits.value.find(u => u.value === editForm.value.baseUnitId)
      }

      editTab.value = 'basic'
      showEditDialog.value = true
    }

    const saveUnitChanges = async () => {
      if (!editUnitId.value) return

      isSaving.value = true
      try {
        const updateData = {
          unitCode: editForm.value.unitCode.toUpperCase(),
          unitName: editForm.value.unitName,
          unitType: editForm.value.unitType,
          unitCategory: editForm.value.unitCategory,
          unitSymbol: editForm.value.unitSymbol || null,
          unitDescription: editForm.value.unitDescription || null,
          baseUnitId: editForm.value.baseUnitId || null,
          conversionFactor: editForm.value.baseUnitId ? (editForm.value.conversionFactor || 1) : 1,
          conversionFormula: editForm.value.conversionFormula || null,
          isSystemUnit: editForm.value.isSystemUnit || false,
          displayOrder: editForm.value.displayOrder || null
        }

        const response = await unitsStore.updateUnit(editUnitId.value, updateData)

        if (response && response.success) {
          showSuccess('Unit updated successfully')
          showEditDialog.value = false
          resetEditForm()
          await loadUnits(currentKeywords.value)
        }
      } catch (error) {
        showError('Failed to update unit')
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
      editUnitId.value = null
      availableEditBaseUnits.value = []
      selectedEditBaseUnit.value = null
    }

    // Unit actions
    const showUnitDetails = async (unit) => {
      selectedUnit.value = unit
      detailsTab.value = 'overview'

      // Load hierarchy data
      try {
        unitHierarchyPath.value = unitsStore.buildUnitHierarchyPath(unit)
        unitHierarchyDepth.value = unitsStore.getUnitHierarchyDepth(unit)
        derivedUnitsCount.value = unitsStore.getDerivedUnitsCount(unit)
      } catch (error) {
        console.error('Failed to load hierarchy data:', error)
      }

      showDetailsDialog.value = true
    }

    const confirmDeleteUnit = async (unit) => {
      if (unit.isSystemUnit) {
        showError('Cannot delete system units')
        return
      }

      $q.dialog({
        title: 'Delete Unit',
        message: `Are you sure you want to delete the unit "${unit.unitName}"?`,
        cancel: true,
        persistent: true,
        color: 'negative'
      }).onOk(async () => {
        try {
          const success = await unitsStore.deleteUnit(unit.recCode)
          if (success) {
            clearSelection()
            await loadUnits(currentKeywords.value)
          }
        } catch (error) {
          showError('Failed to delete unit')
          console.error(error)
        }
      })
    }

    // Conversion functions
    const showConvertFromUnit = (unit) => {
      conversionForm.value.fromUnitId = unit.recCode
      conversionForm.value.value = 1
      conversionForm.value.toUnitId = null
      conversionResult.value = null
      conversionError.value = ''

      // Load conversion units
      loadConversionUnits(unit.unitType)
      showConversionDialog.value = true
    }

    const loadConversionUnits = async (unitType) => {
      try {
        const response = await unitsStore.fetchUnitsByType(unitType)
        const units = response.map(unit => ({
          label: formatUnitDisplayName(unit),
          value: unit.recCode,
          ...unit
        }))

        conversionFromUnits.value = units
        conversionToUnits.value = units
      } catch (error) {
        console.error('Failed to load conversion units:', error)
        conversionFromUnits.value = []
        conversionToUnits.value = []
      }
    }

    const onFromUnitChange = async () => {
      if (conversionForm.value.fromUnitId) {
        const fromUnit = conversionFromUnits.value.find(u => u.value === conversionForm.value.fromUnitId)
        if (fromUnit) {
          // Load convertible units for this unit type
          await loadConversionUnits(fromUnit.unitType)
        }
      }
      conversionResult.value = null
      conversionError.value = ''
    }

    const performConversion = async () => {
      if (!canPerformConversion.value) return

      isLoadingConversion.value = true
      conversionResult.value = null
      conversionError.value = ''

      try {
        const conversionData = {
          value: conversionForm.value.value,
          fromUnitId: conversionForm.value.fromUnitId,
          toUnitId: conversionForm.value.toUnitId
        }

        const response = await unitsStore.convertValue(conversionData)

        if (response && response.success) {
          conversionResult.value = response.data
        } else {
          conversionError.value = response.message || 'Conversion failed'
        }
      } catch (error) {
        conversionError.value = error.response?.data?.message || 'Failed to convert units'
        console.error('Conversion error:', error)
      } finally {
        isLoadingConversion.value = false
      }
    }

    // Lifecycle
    onMounted(async () => {
      await loadUnits()
      // Check user permissions for system unit management
      // This would typically be based on user role from auth store
      canMarkAsSystemUnit.value = true // Set based on actual permissions
    })

    // Watchers
    watch(() => filters.value, () => {
      applyFilters()
    }, { deep: true })

    return {
      // State
      isLoading,
      isCreating,
      isSaving,
      isLoadingOrder,
      isLoadingConversion,
      units,
      selectedUnits,
      currentKeywords,
      filters,

      // Dialogs
      showAddDialog,
      showEditDialog,
      showDetailsDialog,
      showConversionDialog,
      selectedUnit,
      addTab,
      editTab,
      detailsTab,

      // Forms
      addForm,
      editForm,
      conversionForm,
      conversionResult,
      conversionError,

      // Base units
      availableBaseUnits,
      availableEditBaseUnits,
      selectedBaseUnit,
      selectedEditBaseUnit,

      // Conversion units
      conversionFromUnits,
      conversionToUnits,

      // Hierarchy
      unitHierarchyPath,
      unitHierarchyDepth,
      derivedUnitsCount,

      // Permissions
      canMarkAsSystemUnit,

      // Table
      pagination,
      columns,

      // Options
      unitTypeOptions,
      unitCategoryOptions,
      systemUnitOptions,
      baseUnitOptions,
      conversionFormulaOptions,

      // Computed
      canPerformConversion,
      fromUnitDisplay,
      toUnitDisplay,

      // Methods
      loadUnits,
      onTableRequest,
      clearSelection,
      handleSearch,
      handleChipsUpdated,
      applyFilters,

      // Display
      getUnitTypeIcon,
      getUnitTypeColor,
      getUnitCategoryColor,
      getBaseUnitIndicator,
      getSystemUnitIndicator,
      formatConversionFactor,
      formatUnitDisplayName,

      // Add unit
      onUnitTypeChange,
      onBaseUnitChange,
      getNextDisplayOrder,
      createUnit,
      cancelAdd,
      resetAddForm,

      // Edit unit
      onEditUnitTypeChange,
      onEditBaseUnitChange,
      editUnit,
      saveUnitChanges,
      cancelEdit,
      resetEditForm,

      // Unit actions
      showUnitDetails,
      confirmDeleteUnit,
      showConvertFromUnit,

      // Conversion
      loadConversionUnits,
      onFromUnitChange,
      performConversion
    }
  }
}
</script>

<style lang="scss" scoped>
.units-management {
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

  .units-table {
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

    // Unit info styling
    .unit-info {
      .unit-name {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
        font-size: 14px;
      }

      .unit-code {
        font-size: 12px;
        color: #6b7280;
        font-family: 'Courier New', monospace;
      }
    }

    // Symbol display
    .symbol-display {
      display: flex;
      justify-content: center;

      .symbol-badge {
        font-weight: 600;
        font-size: 11px;
      }

      .no-symbol {
        color: #9ca3af;
        font-size: 14px;
      }
    }

    // Base unit info
    .base-unit-info {
      .base-unit-chip {
        font-weight: 500;
        font-size: 11px;
        margin-bottom: 4px;
      }

      .base-unit-name {
        font-size: 12px;
        color: #6b7280;
        font-style: italic;
      }
    }

    // Conversion factor
    .conversion-factor {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;

      .factor-value {
        font-family: 'Courier New', monospace;
        font-size: 13px;
        font-weight: 500;
      }

      .formula-icon {
        cursor: help;
      }
    }

    // Status chips
    .type-chip, .category-chip, .base-unit-chip, .system-chip {
      font-weight: 500;
      font-size: 11px;
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

// Dialog Styling with q-bar
.add-unit-dialog, .edit-unit-dialog, .unit-details-dialog, .conversion-dialog {
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

      .info-banner, .conversion-preview, .display-preview {
        margin-top: 16px;

        .conversion-info, .preview-info {
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

// Conversion Dialog
.conversion-dialog {
  width: 80vw;
  max-width: 800px;

  .conversion-form {
    padding: 32px;

    .conversion-inputs {
      display: grid;
      grid-template-columns: 1fr auto 1fr auto;
      gap: 16px;
      align-items: end;
      margin-bottom: 24px;

      .conversion-arrow {
        display: flex;
        align-items: center;
        justify-content: center;
        padding-bottom: 8px;
      }
    }

    .conversion-result {
      margin-bottom: 24px;

      .result-card {
        border: 2px solid #10b981;
        background: #f0fdf4;

        .result-content {
          text-align: center;

          .result-value {
            font-size: 1.25rem;
            color: #1f2937;
            margin-bottom: 8px;

            .converted-value {
              color: #10b981;
              font-size: 1.5rem;
            }
          }

          .result-factor {
            font-size: 0.875rem;
            color: #6b7280;
            font-family: 'Courier New', monospace;
          }
        }
      }
    }

    .conversion-error {
      .error-banner {
        border: 2px solid #ef4444;
        background: #fef2f2;
      }
    }
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

  .conversion-content, .hierarchy-content {
    padding: 24px;

    h6 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 20px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .conversion-section, .derived-section, .hierarchy-section {
      margin-bottom: 32px;

      .conversion-details {
        .detail-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;

          &:last-child {
            border-bottom: none;
          }

          label {
            font-weight: 500;
            color: #374151;
            font-size: 0.875rem;
          }

          span, .formula-code {
            color: #1f2937;
          }

          .formula-code {
            background: #f3f4f6;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
          }
        }
      }

      .hierarchy-path {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 20px;

        .path-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .path-arrow {
          margin: 0 4px;
        }
      }

      .hierarchy-info, .derived-info {
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;

          &:last-child {
            border-bottom: none;
          }

          label {
            font-weight: 500;
            color: #374151;
          }

          span {
            color: #1f2937;
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

  .add-unit-dialog, .edit-unit-dialog, .unit-details-dialog {
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

  .conversion-dialog {
    width: 95vw;
    margin: 16px;

    .conversion-form {
      padding: 16px;

      .conversion-inputs {
        grid-template-columns: 1fr;
        gap: 12px;

        .conversion-arrow {
          transform: rotate(90deg);
          padding: 0;
        }
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

  .hierarchy-path {
    flex-direction: column;
    align-items: flex-start;

    .path-arrow {
      transform: rotate(90deg);
    }
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
