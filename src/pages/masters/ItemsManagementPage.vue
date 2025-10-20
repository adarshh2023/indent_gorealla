<template>
  <div class="q-pa-md">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold">Items Management</div>
        <div class="text-grey-6">Manage your inventory items</div>
      </div>
      <div class="row q-gutter-sm">
        <q-btn
          color="primary"
          icon="add"
          label="Add Item"
          @click="showCreateDialog = true"
          :loading="isLoading"
        />
        <q-btn
          color="secondary"
          icon="analytics"
          label="Analytics"
          @click="showAnalyticsDialog = true"
          :loading="isLoading"
        />
        <q-btn
          color="info"
          icon="download"
          label="Export"
          @click="showExportDialog = true"
          :loading="isLoading"
        />
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="row q-gutter-md q-mb-lg">
      <q-card class="col-md-2 col-sm-6 col-xs-12">
        <q-card-section>
          <div class="text-overline text-grey-6">Total Items</div>
          <div class="text-h6 text-weight-bold">{{ itemStatistics.total || 0 }}</div>
        </q-card-section>
      </q-card>

      <q-card class="col-md-2 col-sm-6 col-xs-12">
        <q-card-section>
          <div class="text-overline text-grey-6">Active Items</div>
          <div class="text-h6 text-weight-bold text-positive">
            {{ itemStatistics.byStatus?.Active || 0 }}
          </div>
        </q-card-section>
      </q-card>

      <q-card class="col-md-2 col-sm-6 col-xs-12">
        <q-card-section>
          <div class="text-overline text-grey-6">Testing Required</div>
          <div class="text-h6 text-weight-bold text-warning">
            {{ itemStatistics.testing || 0 }}
          </div>
        </q-card-section>
      </q-card>

      <q-card class="col-md-2 col-sm-6 col-xs-12">
        <q-card-section>
          <div class="text-overline text-grey-6">Reorder Required</div>
          <div class="text-h6 text-weight-bold text-negative">
            {{ itemStatistics.requiresReorder || 0 }}
          </div>
        </q-card-section>
      </q-card>

      <q-card class="col-md-2 col-sm-6 col-xs-12">
        <q-card-section>
          <div class="text-overline text-grey-6">With Vendors</div>
          <div class="text-h6 text-weight-bold text-info">
            {{ itemStatistics.withVendor || 0 }}
          </div>
        </q-card-section>
      </q-card>

      <q-card class="col-md-2 col-sm-6 col-xs-12">
        <q-card-section>
          <div class="text-overline text-grey-6">Avg Cost</div>
          <div class="text-h6 text-weight-bold">
            {{ formatCurrency(itemStatistics.avgCost) }}
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Filters -->
    <q-card flat class="q-mb-md">
      <q-card-section>
        <div class="row q-gutter-md">
          <!-- Search -->
          <q-input
            v-model="searchTerm"
            placeholder="Search items..."
            outlined
            dense
            style="min-width: 300px"
            @input="debouncedSearch"
            clearable
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>

          <!-- Category Filter -->
          <q-select
            v-model="filters.itemCategoryId"
            :options="categoryOptions"
            placeholder="Category"
            outlined
            dense
            clearable
            style="min-width: 200px"
            @update:model-value="applyFilters"
          />

          <!-- Status Filter -->
          <q-select
            v-model="filters.itemStatus"
            :options="statusOptions"
            placeholder="Status"
            outlined
            dense
            clearable
            style="min-width: 150px"
            @update:model-value="applyFilters"
          />

          <!-- Material Filter -->
          <q-select
            v-model="filters.material"
            :options="materialOptions"
            placeholder="Material"
            outlined
            dense
            clearable
            style="min-width: 150px"
            @update:model-value="applyFilters"
          />

          <!-- More Filters Button -->
          <q-btn
            icon="tune"
            label="More Filters"
            flat
            @click="showAdvancedFilters = !showAdvancedFilters"
          />

          <!-- Clear Filters -->
          <q-btn
            icon="clear"
            label="Clear"
            flat
            @click="clearAllFilters"
            v-if="hasActiveFilters"
          />
        </div>

        <!-- Advanced Filters -->
        <q-slide-transition>
          <div v-show="showAdvancedFilters" class="q-mt-md">
            <q-separator class="q-mb-md" />
            <div class="row q-gutter-md">
              <!-- Base Unit Filter -->
              <q-select
                v-model="filters.baseUnitId"
                :options="unitOptions"
                placeholder="Base Unit"
                outlined
                dense
                clearable
                style="min-width: 150px"
                @update:model-value="applyFilters"
              />

              <!-- Vendor Filter -->
              <q-select
                v-model="filters.preferredVendorId"
                :options="vendorOptions"
                placeholder="Preferred Vendor"
                outlined
                dense
                clearable
                style="min-width: 200px"
                @update:model-value="applyFilters"
              />

              <!-- Testing Requirements -->
              <q-select
                v-model="filters.isTestingRequired"
                :options="booleanOptions"
                placeholder="Testing Required"
                outlined
                dense
                clearable
                style="min-width: 150px"
                @update:model-value="applyFilters"
              />

              <!-- Sample Requirements -->
              <q-select
                v-model="filters.isSampleRequired"
                :options="booleanOptions"
                placeholder="Sample Required"
                outlined
                dense
                clearable
                style="min-width: 150px"
                @update:model-value="applyFilters"
              />

              <!-- System Item Filter -->
              <q-select
                v-model="filters.isSystemItem"
                :options="booleanOptions"
                placeholder="System Item"
                outlined
                dense
                clearable
                style="min-width: 150px"
                @update:model-value="applyFilters"
              />

              <!-- Cost Range -->
              <q-input
                v-model.number="filters.minCost"
                placeholder="Min Cost"
                type="number"
                outlined
                dense
                style="min-width: 120px"
                @update:model-value="applyFilters"
              />
              <q-input
                v-model.number="filters.maxCost"
                placeholder="Max Cost"
                type="number"
                outlined
                dense
                style="min-width: 120px"
                @update:model-value="applyFilters"
              />
            </div>
          </div>
        </q-slide-transition>
      </q-card-section>
    </q-card>

    <!-- Items Table -->
    <q-table
      :rows="filteredItems"
      :columns="columns"
      row-key="recCode"
      :loading="isLoading"
      :pagination="pagination"
      @request="onRequest"
      selection="multiple"
      v-model:selected="selectedItems"
      flat
      bordered
    >
      <template v-slot:top-right>
        <div class="row q-gutter-sm" v-if="selectedItems.length > 0">
          <q-btn
            color="negative"
            icon="delete"
            :label="`Delete Selected (${selectedItems.length})`"
            @click="confirmBulkDelete"
            size="sm"
          />
        </div>
      </template>

      <template v-slot:body-cell-itemCode="props">
        <q-td :props="props">
          <q-badge color="primary" :label="props.value" />
        </q-td>
      </template>

      <template v-slot:body-cell-itemName="props">
        <q-td :props="props">
          <div class="text-weight-medium">{{ props.value }}</div>
          <div class="text-caption text-grey-6" v-if="props.row.itemDescription">
            {{ props.row.itemDescription.substring(0, 50) }}{{ props.row.itemDescription.length > 50 ? '...' : '' }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-category="props">
        <q-td :props="props">
          <q-badge color="secondary" :label="props.value" />
        </q-td>
      </template>

      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-badge
            :color="getItemStatusColor(props.value)"
            :label="props.value"
          />
        </q-td>
      </template>

      <template v-slot:body-cell-requirements="props">
        <q-td :props="props">
          <div class="row q-gutter-xs">
            <q-chip
              v-if="props.row.isTestingRequired"
              size="sm"
              color="warning"
              text-color="white"
              icon="science"
            >
              Testing
            </q-chip>
            <q-chip
              v-if="props.row.isSampleRequired"
              size="sm"
              color="info"
              text-color="white"
              icon="view_in_ar"
            >
              Sample
            </q-chip>
            <q-chip
              v-if="props.row.isQRTrackingRequired"
              size="sm"
              color="purple"
              text-color="white"
              icon="qr_code"
            >
              QR
            </q-chip>
            <q-chip
              v-if="props.row.isSerialNumberRequired"
              size="sm"
              color="deep-orange"
              text-color="white"
              icon="confirmation_number"
            >
              Serial
            </q-chip>
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-cost="props">
        <q-td :props="props">
          <div v-if="props.row.estimatedCost">
            <div class="text-weight-medium">{{ formatCurrency(props.row.estimatedCost) }}</div>
            <div class="text-caption text-grey-6" v-if="props.row.lastPurchaseRate">
              Last: {{ formatCurrency(props.row.lastPurchaseRate) }}
            </div>
          </div>
          <div v-else class="text-grey-6">No cost data</div>
        </q-td>
      </template>

      <template v-slot:body-cell-vendor="props">
        <q-td :props="props">
          <q-badge
            v-if="props.row.preferredVendorName"
            color="positive"
            :label="props.row.preferredVendorName"
          />
          <span v-else class="text-grey-6">No vendor</span>
        </q-td>
      </template>

      <template v-slot:body-cell-inventory="props">
        <q-td :props="props">
          <div v-if="props.row.requiresReorder">
            <q-badge color="negative" label="Reorder Required" />
          </div>
          <div v-else-if="props.row.currentStock">
            <q-badge color="positive" :label="`Stock: ${props.row.currentStock}`" />
          </div>
          <div v-else class="text-grey-6">No stock data</div>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <div class="row q-gutter-xs">
            <q-btn
              icon="edit"
              size="sm"
              flat
              round
              @click="editItem(props.row)"
            />
            <q-btn
              icon="visibility"
              size="sm"
              flat
              round
              @click="viewItem(props.row)"
            />
            <q-btn
              icon="delete"
              size="sm"
              flat
              round
              color="negative"
              @click="confirmDelete(props.row)"
            />
          </div>
        </q-td>
      </template>
    </q-table>

    <!-- Create/Edit Item Dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 600px">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ editingItem ? 'Edit Item' : 'Create New Item' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section style="max-height: 70vh; overflow: auto">
          <q-form @submit="saveItem" class="q-gutter-md">
            <!-- Basic Information -->
            <div class="text-subtitle2 text-weight-medium">Basic Information</div>

            <div class="row q-gutter-md">
              <q-input
                v-model="itemForm.itemCode"
                label="Item Code"
                outlined
                class="col"
                :rules="[val => !!val || 'Item code is required']"
              >
                <template v-slot:append>
                  <q-btn
                    icon="auto_awesome"
                    flat
                    round
                    @click="generateItemCode"
                    :loading="isGeneratingCode"
                  >
                    <q-tooltip>Generate Code</q-tooltip>
                  </q-btn>
                </template>
              </q-input>

              <q-input
                v-model="itemForm.itemName"
                label="Item Name *"
                outlined
                class="col"
                :rules="[val => !!val || 'Item name is required']"
              />
            </div>

            <q-input
              v-model="itemForm.itemDescription"
              label="Description"
              outlined
              type="textarea"
              rows="3"
            />

            <!-- Category and Unit -->
            <div class="text-subtitle2 text-weight-medium q-mt-md">Category & Unit</div>

            <div class="row q-gutter-md">
              <q-select
                v-model="itemForm.itemCategoryId"
                :options="categoryOptions"
                label="Category *"
                outlined
                emit-value
                map-options
                class="col"
                :rules="[val => !!val || 'Category is required']"
              />

              <q-select
                v-model="itemForm.baseUnitId"
                :options="unitOptions"
                label="Base Unit *"
                outlined
                emit-value
                map-options
                class="col"
                :rules="[val => !!val || 'Base unit is required']"
              />
            </div>

            <!-- Physical Properties -->
            <div class="text-subtitle2 text-weight-medium q-mt-md">Physical Properties</div>

            <div class="row q-gutter-md">
              <q-input
                v-model="itemForm.material"
                label="Material"
                outlined
                class="col"
              />

              <q-input
                v-model="itemForm.grade"
                label="Grade"
                outlined
                class="col"
              />

              <q-input
                v-model="itemForm.color"
                label="Color"
                outlined
                class="col"
              />
            </div>

            <div class="row q-gutter-md">
              <q-input
                v-model.number="itemForm.weight"
                label="Weight (kg)"
                type="number"
                outlined
                class="col"
              />

              <q-input
                v-model.number="itemForm.volume"
                label="Volume (L)"
                type="number"
                outlined
                class="col"
              />

              <q-input
                v-model="itemForm.dimensions"
                label="Dimensions"
                outlined
                class="col"
              />
            </div>

            <!-- Standards -->
            <div class="text-subtitle2 text-weight-medium q-mt-md">Standards & Compliance</div>

            <div class="row q-gutter-md">
              <q-input
                v-model="itemForm.isiStandard"
                label="ISI Standard"
                outlined
                class="col"
              />

              <q-input
                v-model="itemForm.bisStandard"
                label="BIS Standard"
                outlined
                class="col"
              />

              <q-input
                v-model="itemForm.hsnCode"
                label="HSN Code"
                outlined
                class="col"
              />
            </div>

            <!-- Requirements -->
            <div class="text-subtitle2 text-weight-medium q-mt-md">Requirements</div>

            <div class="row q-gutter-lg">
              <q-checkbox
                v-model="itemForm.isTestingRequired"
                label="Testing Required"
              />

              <q-checkbox
                v-model="itemForm.isSampleRequired"
                label="Sample Required"
              />

              <q-checkbox
                v-model="itemForm.isQRTrackingRequired"
                label="QR Tracking Required"
              />

              <q-checkbox
                v-model="itemForm.isSerialNumberRequired"
                label="Serial Number Required"
              />
            </div>

            <!-- Cost Information -->
            <div class="text-subtitle2 text-weight-medium q-mt-md">Cost Information</div>

            <div class="row q-gutter-md">
              <q-input
                v-model.number="itemForm.estimatedCost"
                label="Estimated Cost (₹)"
                type="number"
                outlined
                class="col"
              />

              <q-input
                v-model.number="itemForm.lastPurchaseRate"
                label="Last Purchase Rate (₹)"
                type="number"
                outlined
                class="col"
              />

              <q-select
                v-model="itemForm.preferredVendorId"
                :options="vendorOptions"
                label="Preferred Vendor"
                outlined
                clearable
                class="col"
              />
            </div>

            <!-- Inventory Properties -->
            <div class="text-subtitle2 text-weight-medium q-mt-md">Inventory Properties</div>

            <div class="row q-gutter-md">
              <q-input
                v-model.number="itemForm.reorderLevel"
                label="Reorder Level"
                type="number"
                outlined
                class="col"
              />

              <q-input
                v-model.number="itemForm.maxStockLevel"
                label="Max Stock Level"
                type="number"
                outlined
                class="col"
              />

              <q-input
                v-model.number="itemForm.safetyStock"
                label="Safety Stock"
                type="number"
                outlined
                class="col"
              />
            </div>

            <!-- Status -->
            <div class="text-subtitle2 text-weight-medium q-mt-md">Status</div>

            <div class="row q-gutter-md">
              <q-select
                v-model="itemForm.itemStatus"
                :options="statusOptions"
                label="Status"
                outlined
                class="col"
              />

              <q-checkbox
                v-model="itemForm.isSystemItem"
                label="System Item"
                class="col"
              />
            </div>

            <!-- Notes -->
            <q-input
              v-model="itemForm.itemNotes"
              label="Notes"
              outlined
              type="textarea"
              rows="3"
            />
          </q-form>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            color="primary"
            label="Save"
            @click="saveItem"
            :loading="isLoading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Item Details Dialog -->
    <q-dialog v-model="showDetailsDialog">
      <q-card style="min-width: 700px">
        <q-card-section class="row items-center">
          <div class="text-h6">Item Details</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section v-if="selectedItem">
          <div class="row q-gutter-md">
            <!-- Basic Info -->
            <div class="col-md-6 col-xs-12">
              <q-list>
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Item Code</q-item-label>
                    <q-item-label>{{ selectedItem.itemCode }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Item Name</q-item-label>
                    <q-item-label>{{ selectedItem.itemName }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Category</q-item-label>
                    <q-item-label>{{ selectedItem.itemCategoryName }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Status</q-item-label>
                    <q-item-label>
                      <q-badge :color="getItemStatusColor(selectedItem.itemStatus)">
                        {{ selectedItem.itemStatus }}
                      </q-badge>
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Base Unit</q-item-label>
                    <q-item-label>{{ selectedItem.baseUnitName }} ({{ selectedItem.baseUnitSymbol }})</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <!-- Physical Properties -->
            <div class="col-md-6 col-xs-12">
              <q-list>
                <q-item v-if="selectedItem.material">
                  <q-item-section>
                    <q-item-label caption>Material</q-item-label>
                    <q-item-label>{{ selectedItem.material }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="selectedItem.grade">
                  <q-item-section>
                    <q-item-label caption>Grade</q-item-label>
                    <q-item-label>{{ selectedItem.grade }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="selectedItem.weight">
                  <q-item-section>
                    <q-item-label caption>Weight</q-item-label>
                    <q-item-label>{{ selectedItem.weight }} kg</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="selectedItem.estimatedCost">
                  <q-item-section>
                    <q-item-label caption>Estimated Cost</q-item-label>
                    <q-item-label>{{ formatCurrency(selectedItem.estimatedCost) }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="selectedItem.preferredVendorName">
                  <q-item-section>
                    <q-item-label caption>Preferred Vendor</q-item-label>
                    <q-item-label>{{ selectedItem.preferredVendorName }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>

          <!-- Requirements -->
          <div class="q-mt-md" v-if="hasRequirements(selectedItem)">
            <div class="text-subtitle2 text-weight-medium q-mb-sm">Requirements</div>
            <div class="row q-gutter-sm">
              <q-chip
                v-if="selectedItem.isTestingRequired"
                color="warning"
                text-color="white"
                icon="science"
              >
                Testing Required
              </q-chip>
              <q-chip
                v-if="selectedItem.isSampleRequired"
                color="info"
                text-color="white"
                icon="view_in_ar"
              >
                Sample Required
              </q-chip>
              <q-chip
                v-if="selectedItem.isQRTrackingRequired"
                color="purple"
                text-color="white"
                icon="qr_code"
              >
                QR Tracking Required
              </q-chip>
              <q-chip
                v-if="selectedItem.isSerialNumberRequired"
                color="deep-orange"
                text-color="white"
                icon="confirmation_number"
              >
                Serial Number Required
              </q-chip>
            </div>
          </div>

          <!-- Description -->
          <div class="q-mt-md" v-if="selectedItem.itemDescription">
            <div class="text-subtitle2 text-weight-medium q-mb-sm">Description</div>
            <div class="text-body2">{{ selectedItem.itemDescription }}</div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" v-close-popup />
          <q-btn
            color="primary"
            label="Edit"
            @click="editItem(selectedItem)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Analytics Dialog -->
    <q-dialog v-model="showAnalyticsDialog">
      <q-card style="min-width: 800px">
        <q-card-section class="row items-center">
          <div class="text-h6">Items Analytics</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="row q-gutter-md">
            <!-- Status Distribution -->
            <div class="col-md-6 col-xs-12">
              <div class="text-subtitle2 text-weight-medium q-mb-sm">Status Distribution</div>
              <q-list>
                <q-item v-for="(count, status) in itemStatistics.byStatus" :key="status">
                  <q-item-section>
                    <q-item-label>{{ status }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge :color="getItemStatusColor(status)" :label="count" />
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <!-- Category Distribution -->
            <div class="col-md-6 col-xs-12">
              <div class="text-subtitle2 text-weight-medium q-mb-sm">Category Distribution</div>
              <q-list>
                <q-item v-for="(count, category) in itemStatistics.byCategory" :key="category">
                  <q-item-section>
                    <q-item-label>{{ category }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge color="secondary" :label="count" />
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>

          <!-- Material Distribution -->
          <div class="q-mt-md" v-if="Object.keys(itemStatistics.byMaterial || {}).length > 0">
            <div class="text-subtitle2 text-weight-medium q-mb-sm">Material Distribution</div>
            <div class="row q-gutter-sm">
              <q-chip
                v-for="(count, material) in itemStatistics.byMaterial"
                :key="material"
                color="accent"
                text-color="white"
                :icon="getMaterialTypeIcon(material)"
              >
                {{ material }}: {{ count }}
              </q-chip>
            </div>
          </div>

          <!-- Requirements Summary -->
          <div class="q-mt-md">
            <div class="text-subtitle2 text-weight-medium q-mb-sm">Requirements Summary</div>
            <div class="row q-gutter-md">
              <q-card flat bordered class="col">
                <q-card-section class="text-center">
                  <div class="text-h6 text-warning">{{ itemStatistics.testing || 0 }}</div>
                  <div class="text-caption">Testing Required</div>
                </q-card-section>
              </q-card>
              <q-card flat bordered class="col">
                <q-card-section class="text-center">
                  <div class="text-h6 text-info">{{ itemStatistics.samples || 0 }}</div>
                  <div class="text-caption">Samples Required</div>
                </q-card-section>
              </q-card>
              <q-card flat bordered class="col">
                <q-card-section class="text-center">
                  <div class="text-h6 text-purple">{{ itemStatistics.qrTracking || 0 }}</div>
                  <div class="text-caption">QR Tracking</div>
                </q-card-section>
              </q-card>
              <q-card flat bordered class="col">
                <q-card-section class="text-center">
                  <div class="text-h6 text-deep-orange">{{ itemStatistics.serialNumbers || 0 }}</div>
                  <div class="text-caption">Serial Numbers</div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Export Dialog -->
    <q-dialog v-model="showExportDialog">
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center">
          <div class="text-h6">Export Items</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-form @submit="performExport" class="q-gutter-md">
            <q-select
              v-model="exportFormat"
              :options="exportFormatOptions"
              label="Export Format"
              outlined
            />

            <q-checkbox
              v-model="includeMetadata"
              label="Include Metadata"
            />

            <q-checkbox
              v-model="exportSelectedOnly"
              :label="`Export Selected Only (${selectedItems.length} items)`"
              :disable="selectedItems.length === 0"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            color="primary"
            label="Export"
            @click="performExport"
            :loading="isLoading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Confirm Delete Dialog -->
    <q-dialog v-model="showDeleteConfirmDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm">
            {{ deleteTargetMultiple
                ? `Are you sure you want to delete ${selectedItems.length} selected items?`
                : `Are you sure you want to delete "${deleteTarget?.itemName}"?`
            }}
          </span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            flat
            label="Delete"
            color="negative"
            @click="performDelete"
            :loading="isLoading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useItemsStore } from 'stores/items'
import { useItemCategoriesStore } from 'stores/item-categories'
import { useUnitsStore } from 'stores/units'
import { useVendorsStore } from 'stores/vendors'
import { debounce } from 'lodash'

const $q = useQuasar()

// Stores
const itemsStore = useItemsStore()
const categoriesStore = useItemCategoriesStore()
const unitsStore = useUnitsStore()
const vendorsStore = useVendorsStore()

// Reactive data
const searchTerm = ref('')
const showAdvancedFilters = ref(false)
const showCreateDialog = ref(false)
const showDetailsDialog = ref(false)
const showAnalyticsDialog = ref(false)
const showExportDialog = ref(false)
const showDeleteConfirmDialog = ref(false)
const selectedItems = ref([])
const selectedItem = ref(null)
const deleteTarget = ref(null)
const deleteTargetMultiple = ref(false)
const editingItem = ref(null)

// Form data
const itemForm = ref({
  itemCode: '',
  itemName: '',
  itemDescription: '',
  itemCategoryId: null,
  baseUnitId: null,
  material: '',
  grade: '',
  color: '',
  weight: null,
  volume: null,
  dimensions: '',
  isiStandard: '',
  bisStandard: '',
  hsnCode: '',
  isTestingRequired: false,
  isSampleRequired: false,
  isQRTrackingRequired: false,
  isSerialNumberRequired: false,
  estimatedCost: null,
  lastPurchaseRate: null,
  preferredVendorId: null,
  reorderLevel: null,
  maxStockLevel: null,
  safetyStock: null,
  itemStatus: 'Active',
  isSystemItem: false,
  itemNotes: ''
})

// Export options
const exportFormat = ref('EXCEL')
const includeMetadata = ref(true)
const exportSelectedOnly = ref(false)

// Pagination
const pagination = ref({
  sortBy: 'itemName',
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0
})

// Computed
const isLoading = computed(() => itemsStore.isLoading)
const isGeneratingCode = computed(() => itemsStore.isGeneratingCode)
// eslint-disable-next-line no-unused-vars
const items = computed(() => itemsStore.items)
const filteredItems = computed(() => itemsStore.filteredItems)
const itemStatistics = computed(() => itemsStore.itemStatistics)
const filters = computed(() => itemsStore.filters)

const categoryOptions = computed(() =>
  categoriesStore.categoriesForSelection || []
)

const unitOptions = computed(() =>
  unitsStore.unitsForSelection || []
)

const vendorOptions = computed(() =>
  vendorsStore.activeVendorsForSelection || []
)

const statusOptions = [
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
  { label: 'Draft', value: 'Draft' },
  { label: 'Discontinued', value: 'Discontinued' }
]

const materialOptions = computed(() =>
  itemsStore.allMaterials.map(material => ({ label: material, value: material }))
)

const booleanOptions = [
  { label: 'Yes', value: true },
  { label: 'No', value: false }
]

const exportFormatOptions = [
  { label: 'Excel', value: 'EXCEL' },
  { label: 'CSV', value: 'CSV' },
  { label: 'PDF', value: 'PDF' }
]

const hasActiveFilters = computed(() => {
  return Object.values(filters.value).some(value =>
    value !== null && value !== '' && value !== false
  ) || searchTerm.value
})

// Table columns
const columns = [
  {
    name: 'itemCode',
    label: 'Item Code',
    align: 'left',
    field: 'itemCode',
    sortable: true
  },
  {
    name: 'itemName',
    label: 'Item Name',
    align: 'left',
    field: 'itemName',
    sortable: true
  },
  {
    name: 'category',
    label: 'Category',
    align: 'left',
    field: 'itemCategoryName',
    sortable: true
  },
  {
    name: 'status',
    label: 'Status',
    align: 'center',
    field: 'itemStatus',
    sortable: true
  },
  {
    name: 'requirements',
    label: 'Requirements',
    align: 'center',
    field: 'requirements',
    sortable: false
  },
  {
    name: 'cost',
    label: 'Cost',
    align: 'right',
    field: 'estimatedCost',
    sortable: true
  },
  {
    name: 'vendor',
    label: 'Vendor',
    align: 'left',
    field: 'preferredVendorName',
    sortable: true
  },
  {
    name: 'inventory',
    label: 'Inventory',
    align: 'center',
    field: 'inventory',
    sortable: false
  },
  {
    name: 'actions',
    label: 'Actions',
    align: 'center',
    field: 'actions',
    sortable: false
  }
]

// Methods
const debouncedSearch = debounce((value) => {
  itemsStore.setFilters({ search: value })
  applyFilters()
}, 300)

const applyFilters = async () => {
  try {
    await itemsStore.searchItems(
      searchTerm.value,
      itemsStore.filters,
      {
        page: 0,
        size: pagination.value.rowsPerPage
      }
    )
    pagination.value.rowsNumber = itemsStore.totalItems
  } catch (error) {
    console.error('Search failed:', error)
  }
}

const clearAllFilters = () => {
  searchTerm.value = ''
  itemsStore.clearFilters()
  fetchItems()
}

const onRequest = async (props) => {
  const { page, rowsPerPage, sortBy, descending } = props.pagination

  try {
    await itemsStore.fetchItems({
      page: page - 1,
      size: rowsPerPage,
      sort: sortBy,
      direction: descending ? 'DESC' : 'ASC'
    })

    pagination.value.page = page
    pagination.value.rowsPerPage = rowsPerPage
    pagination.value.sortBy = sortBy
    pagination.value.descending = descending
    pagination.value.rowsNumber = itemsStore.totalItems
  } catch (error) {
    console.error('Failed to fetch items:', error)
  }
}

const fetchItems = async () => {
  try {
    await itemsStore.fetchItems({
      page: pagination.value.page - 1,
      size: pagination.value.rowsPerPage
    })
    pagination.value.rowsNumber = itemsStore.totalItems
  } catch (error) {
    console.error('Failed to fetch items:', error)
  }
}

const editItem = (item) => {
  editingItem.value = item
  itemForm.value = { ...item }
  showCreateDialog.value = true
  showDetailsDialog.value = false
}

const viewItem = (item) => {
  selectedItem.value = item
  showDetailsDialog.value = true
}

const confirmDelete = (item) => {
  deleteTarget.value = item
  deleteTargetMultiple.value = false
  showDeleteConfirmDialog.value = true
}

const confirmBulkDelete = () => {
  deleteTargetMultiple.value = true
  showDeleteConfirmDialog.value = true
}

const performDelete = async () => {
  try {
    if (deleteTargetMultiple.value) {
      for (const item of selectedItems.value) {
        await itemsStore.deleteItem(item.recCode)
      }
      selectedItems.value = []
    } else {
      await itemsStore.deleteItem(deleteTarget.value.recCode)
    }
    showDeleteConfirmDialog.value = false
    await fetchItems()
  } catch (error) {
    console.error('Delete failed:', error)
  }
}

const generateItemCode = async () => {
  try {
    const code = await itemsStore.generateItemCode()
    itemForm.value.itemCode = code
  } catch (error) {
    console.error('Failed to generate item code:', error)
  }
}

const saveItem = async () => {
  try {
    if (editingItem.value) {
      await itemsStore.updateItem(editingItem.value.recCode, itemForm.value)
    } else {
      await itemsStore.createItem(itemForm.value)
    }

    showCreateDialog.value = false
    resetForm()
    await fetchItems()
  } catch (error) {
    console.error('Save failed:', error)
  }
}

const resetForm = () => {
  editingItem.value = null
  itemForm.value = {
    itemCode: '',
    itemName: '',
    itemDescription: '',
    itemCategoryId: null,
    baseUnitId: null,
    material: '',
    grade: '',
    color: '',
    weight: null,
    volume: null,
    dimensions: '',
    isiStandard: '',
    bisStandard: '',
    hsnCode: '',
    isTestingRequired: false,
    isSampleRequired: false,
    isQRTrackingRequired: false,
    isSerialNumberRequired: false,
    estimatedCost: null,
    lastPurchaseRate: null,
    preferredVendorId: null,
    reorderLevel: null,
    maxStockLevel: null,
    safetyStock: null,
    itemStatus: 'Active',
    isSystemItem: false,
    itemNotes: ''
  }
}

const performExport = async () => {
  try {
    const itemIds = exportSelectedOnly.value && selectedItems.value.length > 0
      ? selectedItems.value.map(item => item.recCode)
      : null

    await itemsStore.exportItems(itemIds, exportFormat.value, includeMetadata.value)
    showExportDialog.value = false
  } catch (error) {
    console.error('Export failed:', error)
  }
}

const hasRequirements = (item) => {
  return item.isTestingRequired || item.isSampleRequired ||
         item.isQRTrackingRequired || item.isSerialNumberRequired
}

// Utility methods
const getItemStatusColor = (status) => itemsStore.getItemStatusColor(status)
const formatCurrency = (amount) => itemsStore.formatCurrency(amount)
const getMaterialTypeIcon = (material) => itemsStore.getMaterialTypeIcon(material)

// Watchers
watch(() => showCreateDialog.value, (newVal) => {
  if (!newVal) {
    resetForm()
  }
})

// Lifecycle
onMounted(async () => {
  try {
    // Load initial data
    await Promise.all([
      itemsStore.fetchItems(),
      categoriesStore.fetchCategories(),
      unitsStore.fetchUnits(),
      vendorsStore.fetchVendors(),
      itemsStore.fetchAllMaterials()
    ])

    pagination.value.rowsNumber = itemsStore.totalItems
  } catch (error) {
    console.error('Failed to load initial data:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load data',
      position: 'top'
    })
  }
})
</script>

<style scoped>
.q-table {
  box-shadow: 0 1px 5px rgba(0,0,0,0.1);
}

.q-card {
  box-shadow: 0 1px 5px rgba(0,0,0,0.1);
}

.text-overline {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.167em;
  line-height: 2rem;
  text-transform: uppercase;
}
</style>
