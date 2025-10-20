<template>
  <div class="q-pa-md">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold">Locations Management</div>
        <div class="text-grey-6">Manage your locations and facilities</div>
      </div>
      <div class="row q-gutter-sm">
        <q-btn
          color="primary"
          icon="add"
          label="Add Location"
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
          <div class="text-overline text-grey-6">Total Locations</div>
          <div class="text-h6 text-weight-bold">{{ locationStatistics.total || 0 }}</div>
        </q-card-section>
      </q-card>

      <q-card class="col-md-2 col-sm-6 col-xs-12">
        <q-card-section>
          <div class="text-overline text-grey-6">Active Locations</div>
          <div class="text-h6 text-weight-bold text-positive">
            {{ locationStatistics.byStatus?.Active || 0 }}
          </div>
        </q-card-section>
      </q-card>

      <q-card class="col-md-2 col-sm-6 col-xs-12">
        <q-card-section>
          <div class="text-overline text-grey-6">Project Locations</div>
          <div class="text-h6 text-weight-bold text-info">
            {{ locationStatistics.projectLocations || 0 }}
          </div>
        </q-card-section>
      </q-card>

      <q-card class="col-md-2 col-sm-6 col-xs-12">
        <q-card-section>
          <div class="text-overline text-grey-6">Inventory Capable</div>
          <div class="text-h6 text-weight-bold text-warning">
            {{ locationStatistics.inventoryCapable || 0 }}
          </div>
        </q-card-section>
      </q-card>

      <q-card class="col-md-2 col-sm-6 col-xs-12">
        <q-card-section>
          <div class="text-overline text-grey-6">With Coordinates</div>
          <div class="text-h6 text-weight-bold text-purple">
            {{ locationStatistics.withCoordinates || 0 }}
          </div>
        </q-card-section>
      </q-card>

      <q-card class="col-md-2 col-sm-6 col-xs-12">
        <q-card-section>
          <div class="text-overline text-grey-6">High Security</div>
          <div class="text-h6 text-weight-bold text-negative">
            {{ locationStatistics.bySecurityLevel?.High || 0 }}
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
            placeholder="Search locations..."
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

          <!-- Type Filter -->
          <q-select
            v-model="filters.locationType"
            :options="locationTypeOptions"
            placeholder="Location Type"
            outlined
            dense
            clearable
            style="min-width: 200px"
            @update:model-value="applyFilters"
          />

          <!-- Status Filter -->
          <q-select
            v-model="filters.locationStatus"
            :options="statusOptions"
            placeholder="Status"
            outlined
            dense
            clearable
            style="min-width: 150px"
            @update:model-value="applyFilters"
          />

          <!-- Project Filter -->
          <q-select
            v-model="filters.projectNodeId"
            :options="projectOptions"
            placeholder="Project"
            outlined
            dense
            clearable
            style="min-width: 200px"
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
              <!-- City Filter -->
              <q-input
                v-model="filters.city"
                placeholder="City"
                outlined
                dense
                style="min-width: 150px"
                @update:model-value="applyFilters"
              />

              <!-- State Filter -->
              <q-input
                v-model="filters.state"
                placeholder="State"
                outlined
                dense
                style="min-width: 150px"
                @update:model-value="applyFilters"
              />

              <!-- Pin Code Filter -->
              <q-input
                v-model="filters.pinCode"
                placeholder="Pin Code"
                outlined
                dense
                style="min-width: 120px"
                @update:model-value="applyFilters"
              />

              <!-- Security Level Filter -->
              <q-select
                v-model="filters.securityLevel"
                :options="securityLevelOptions"
                placeholder="Security Level"
                outlined
                dense
                clearable
                style="min-width: 150px"
                @update:model-value="applyFilters"
              />

              <!-- Inventory Capability -->
              <q-select
                v-model="filters.isInventoryLocation"
                :options="booleanOptions"
                placeholder="Inventory Capable"
                outlined
                dense
                clearable
                style="min-width: 150px"
                @update:model-value="applyFilters"
              />

              <!-- Receiving Capability -->
              <q-select
                v-model="filters.isReceivingLocation"
                :options="booleanOptions"
                placeholder="Receiving Capable"
                outlined
                dense
                clearable
                style="min-width: 150px"
                @update:model-value="applyFilters"
              />

              <!-- Issuing Capability -->
              <q-select
                v-model="filters.isIssuingLocation"
                :options="booleanOptions"
                placeholder="Issuing Capable"
                outlined
                dense
                clearable
                style="min-width: 150px"
                @update:model-value="applyFilters"
              />
            </div>
          </div>
        </q-slide-transition>
      </q-card-section>
    </q-card>

    <!-- Locations Table -->
    <q-table
      :rows="filteredLocations"
      :columns="columns"
      row-key="recCode"
      :loading="isLoading"
      :pagination="pagination"
      @request="onRequest"
      selection="multiple"
      v-model:selected="selectedLocations"
      flat
      bordered
    >
      <template v-slot:top-right>
        <div class="row q-gutter-sm" v-if="selectedLocations.length > 0">
          <q-btn
            color="negative"
            icon="delete"
            :label="`Delete Selected (${selectedLocations.length})`"
            @click="confirmBulkDelete"
            size="sm"
          />
        </div>
      </template>

      <template v-slot:body-cell-locationCode="props">
        <q-td :props="props">
          <q-badge color="primary" :label="props.value" />
        </q-td>
      </template>

      <template v-slot:body-cell-locationName="props">
        <q-td :props="props">
          <div class="text-weight-medium">{{ props.value }}</div>
          <div class="text-caption text-grey-6" v-if="props.row.address">
            {{ props.row.address.substring(0, 50) }}{{ props.row.address.length > 50 ? '...' : '' }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-locationType="props">
        <q-td :props="props">
          <q-badge color="secondary" :label="props.value">
            <q-icon :name="getLocationTypeIcon(props.value)" class="q-mr-xs" />
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-badge
            :color="getLocationStatusColor(props.value)"
            :label="props.value"
          />
        </q-td>
      </template>

      <template v-slot:body-cell-project="props">
        <q-td :props="props">
          <q-badge
            v-if="props.row.projectNodeName"
            color="info"
            :label="props.row.projectNodeName"
            icon="apartment"
          />
          <span v-else class="text-grey-6">No project</span>
        </q-td>
      </template>

      <template v-slot:body-cell-capabilities="props">
        <q-td :props="props">
          <div class="row q-gutter-xs">
            <q-chip
              v-if="props.row.isInventoryLocation"
              size="sm"
              color="primary"
              text-color="white"
              icon="inventory"
            >
              Inventory
            </q-chip>
            <q-chip
              v-if="props.row.isReceivingLocation"
              size="sm"
              color="positive"
              text-color="white"
              icon="local_shipping"
            >
              Receiving
            </q-chip>
            <q-chip
              v-if="props.row.isIssuingLocation"
              size="sm"
              color="warning"
              text-color="white"
              icon="launch"
            >
              Issuing
            </q-chip>
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-location="props">
        <q-td :props="props">
          <div v-if="props.row.city || props.row.state">
            <div class="text-weight-medium">{{ props.row.city }}</div>
            <div class="text-caption text-grey-6">{{ props.row.state }}</div>
          </div>
          <div v-else class="text-grey-6">No address</div>
        </q-td>
      </template>

      <template v-slot:body-cell-contact="props">
        <q-td :props="props">
          <div v-if="props.row.contactPersonName">
            <div class="text-weight-medium">{{ props.row.contactPersonName }}</div>
            <div class="text-caption text-grey-6" v-if="props.row.contactPhone">
              {{ props.row.contactPhone }}
            </div>
          </div>
          <div v-else class="text-grey-6">No contact</div>
        </q-td>
      </template>

      <template v-slot:body-cell-security="props">
        <q-td :props="props">
          <q-badge
            :color="getSecurityLevelColor(props.value)"
            :label="props.value"
          />
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
              @click="editLocation(props.row)"
            />
            <q-btn
              icon="visibility"
              size="sm"
              flat
              round
              @click="viewLocation(props.row)"
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

    <!-- Create/Edit Location Dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 700px">
        <q-bar class="bg-primary text-white">
          <div class="text-h6">{{ editingLocation ? 'Edit Location' : 'Create New Location' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-bar>

        <q-card-section style="max-height: 70vh; overflow: auto">
          <q-form @submit="saveLocation" class="q-gutter-md">
            <!-- Basic Information -->
            <div class="text-subtitle2 text-weight-medium">Basic Information</div>

            <div class="row q-gutter-md">
              <q-input
                v-model="locationForm.locationCode"
                label="Location Code"
                outlined
                class="col"
                :rules="[val => !!val || 'Location code is required']"
              >
                <template v-slot:append>
                  <q-btn
                    icon="auto_awesome"
                    flat
                    round
                    @click="generateLocationCode"
                    :loading="isGeneratingCode"
                  >
                    <q-tooltip>Generate Code</q-tooltip>
                  </q-btn>
                </template>
              </q-input>

              <q-input
                v-model="locationForm.locationName"
                label="Location Name *"
                outlined
                class="col"
                :rules="[val => !!val || 'Location name is required']"
              />
            </div>

            <div class="row q-gutter-md">
              <q-select
                v-model="locationForm.locationType"
                :options="locationTypeOptions"
                label="Location Type *"
                outlined
                emit-value
                map-options
                class="col"
                :rules="[val => !!val || 'Location type is required']"
              />

              <q-select
                v-model="locationForm.locationStatus"
                :options="statusOptions"
                label="Status"
                outlined
                emit-value
                map-options
                class="col"
              />
            </div>

            <!-- Project Assignment -->
            <div class="text-subtitle2 text-weight-medium q-mt-md">Project Assignment</div>

            <q-select
              v-model="locationForm.projectNodeId"
              :options="projectOptions"
              label="Associated Project"
              outlined
              emit-value
              map-options
              clearable
            />

            <!-- Address Information -->
            <div class="text-subtitle2 text-weight-medium q-mt-md">Address Information</div>

            <q-input
              v-model="locationForm.address"
              label="Address"
              outlined
              type="textarea"
              rows="3"
            />

            <div class="row q-gutter-md">
              <q-input
                v-model="locationForm.city"
                label="City"
                outlined
                class="col"
              />

              <q-input
                v-model="locationForm.state"
                label="State"
                outlined
                class="col"
              />

              <q-input
                v-model="locationForm.country"
                label="Country"
                outlined
                class="col"
              />
            </div>

            <div class="row q-gutter-md">
              <q-input
                v-model="locationForm.pinCode"
                label="Pin Code"
                outlined
                class="col"
              />

              <q-input
                v-model.number="locationForm.latitude"
                label="Latitude"
                type="number"
                step="any"
                outlined
                class="col"
              />

              <q-input
                v-model.number="locationForm.longitude"
                label="Longitude"
                type="number"
                step="any"
                outlined
                class="col"
              />
            </div>

            <!-- Contact Information -->
            <div class="text-subtitle2 text-weight-medium q-mt-md">Contact Information</div>

            <div class="row q-gutter-md">
              <q-input
                v-model="locationForm.contactPersonName"
                label="Contact Person Name"
                outlined
                class="col"
              />

              <q-input
                v-model="locationForm.contactPhone"
                label="Contact Phone"
                outlined
                class="col"
              />

              <q-input
                v-model="locationForm.contactEmail"
                label="Contact Email"
                type="email"
                outlined
                class="col"
              />
            </div>

            <!-- Operational Details -->
            <div class="text-subtitle2 text-weight-medium q-mt-md">Operational Details</div>

            <div class="row q-gutter-lg">
              <q-checkbox
                v-model="locationForm.isInventoryLocation"
                label="Inventory Location"
              />

              <q-checkbox
                v-model="locationForm.isReceivingLocation"
                label="Receiving Location"
              />

              <q-checkbox
                v-model="locationForm.isIssuingLocation"
                label="Issuing Location"
              />
            </div>

            <q-select
              v-model="locationForm.securityLevel"
              :options="securityLevelOptions"
              label="Security Level"
              outlined
              emit-value
              map-options
            />

            <!-- Additional Information -->
            <div class="text-subtitle2 text-weight-medium q-mt-md">Additional Information</div>

            <q-input
              v-model="locationForm.facilitiesAvailable"
              label="Facilities Available"
              outlined
              type="textarea"
              rows="2"
            />

            <q-input
              v-model="locationForm.accessRestrictions"
              label="Access Restrictions"
              outlined
              type="textarea"
              rows="2"
            />

            <q-input
              v-model="locationForm.locationNotes"
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
            @click="saveLocation"
            :loading="isLoading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Location Details Dialog -->
    <q-dialog v-model="showDetailsDialog">
      <q-card style="min-width: 800px">
        <q-bar class="bg-info text-white">
          <div class="text-h6">Location Details</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-bar>

        <q-card-section v-if="selectedLocation">
          <div class="row q-gutter-md">
            <!-- Basic Info -->
            <div class="col-md-6 col-xs-12">
              <q-list>
                <q-item>
                  <q-item-section>
                    <q-item-label caption>Location Code</q-item-label>
                    <q-item-label>{{ selectedLocation.locationCode }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Location Name</q-item-label>
                    <q-item-label>{{ selectedLocation.locationName }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Type</q-item-label>
                    <q-item-label>
                      <q-badge :color="getLocationStatusColor(selectedLocation.locationType)">
                        {{ selectedLocation.locationType }}
                      </q-badge>
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Status</q-item-label>
                    <q-item-label>
                      <q-badge :color="getLocationStatusColor(selectedLocation.locationStatus)">
                        {{ selectedLocation.locationStatus }}
                      </q-badge>
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="selectedLocation.projectNodeName">
                  <q-item-section>
                    <q-item-label caption>Project</q-item-label>
                    <q-item-label>{{ selectedLocation.projectNodeName }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section>
                    <q-item-label caption>Security Level</q-item-label>
                    <q-item-label>
                      <q-badge :color="getSecurityLevelColor(selectedLocation.securityLevel)">
                        {{ selectedLocation.securityLevel }}
                      </q-badge>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <!-- Address & Contact -->
            <div class="col-md-6 col-xs-12">
              <q-list>
                <q-item v-if="selectedLocation.address">
                  <q-item-section>
                    <q-item-label caption>Address</q-item-label>
                    <q-item-label>{{ selectedLocation.address }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="selectedLocation.city">
                  <q-item-section>
                    <q-item-label caption>City</q-item-label>
                    <q-item-label>{{ selectedLocation.city }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="selectedLocation.state">
                  <q-item-section>
                    <q-item-label caption>State</q-item-label>
                    <q-item-label>{{ selectedLocation.state }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="selectedLocation.pinCode">
                  <q-item-section>
                    <q-item-label caption>Pin Code</q-item-label>
                    <q-item-label>{{ selectedLocation.pinCode }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="selectedLocation.contactPersonName">
                  <q-item-section>
                    <q-item-label caption>Contact Person</q-item-label>
                    <q-item-label>{{ selectedLocation.contactPersonName }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="selectedLocation.contactPhone">
                  <q-item-section>
                    <q-item-label caption>Contact Phone</q-item-label>
                    <q-item-label>{{ selectedLocation.contactPhone }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>

          <!-- Capabilities -->
          <div class="q-mt-md" v-if="hasCapabilities(selectedLocation)">
            <div class="text-subtitle2 text-weight-medium q-mb-sm">Capabilities</div>
            <div class="row q-gutter-sm">
              <q-chip
                v-if="selectedLocation.isInventoryLocation"
                color="primary"
                text-color="white"
                icon="inventory"
              >
                Inventory Location
              </q-chip>
              <q-chip
                v-if="selectedLocation.isReceivingLocation"
                color="positive"
                text-color="white"
                icon="local_shipping"
              >
                Receiving Location
              </q-chip>
              <q-chip
                v-if="selectedLocation.isIssuingLocation"
                color="warning"
                text-color="white"
                icon="launch"
              >
                Issuing Location
              </q-chip>
            </div>
          </div>

          <!-- Coordinates -->
          <div class="q-mt-md" v-if="selectedLocation.latitude && selectedLocation.longitude">
            <div class="text-subtitle2 text-weight-medium q-mb-sm">Coordinates</div>
            <div class="text-body2">
              Latitude: {{ selectedLocation.latitude }}, Longitude: {{ selectedLocation.longitude }}
            </div>
          </div>

          <!-- Facilities -->
          <div class="q-mt-md" v-if="selectedLocation.facilitiesAvailable">
            <div class="text-subtitle2 text-weight-medium q-mb-sm">Facilities Available</div>
            <div class="text-body2">{{ selectedLocation.facilitiesAvailable }}</div>
          </div>

          <!-- Access Restrictions -->
          <div class="q-mt-md" v-if="selectedLocation.accessRestrictions">
            <div class="text-subtitle2 text-weight-medium q-mb-sm">Access Restrictions</div>
            <div class="text-body2">{{ selectedLocation.accessRestrictions }}</div>
          </div>

          <!-- Notes -->
          <div class="q-mt-md" v-if="selectedLocation.locationNotes">
            <div class="text-subtitle2 text-weight-medium q-mb-sm">Notes</div>
            <div class="text-body2">{{ selectedLocation.locationNotes }}</div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" v-close-popup />
          <q-btn
            color="primary"
            label="Edit"
            @click="editLocation(selectedLocation)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Analytics Dialog -->
    <q-dialog v-model="showAnalyticsDialog">
      <q-card style="min-width: 900px">
        <q-bar class="bg-secondary text-white">
          <div class="text-h6">Locations Analytics</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-bar>

        <q-card-section>
          <div class="row q-gutter-md">
            <!-- Status Distribution -->
            <div class="col-md-6 col-xs-12">
              <div class="text-subtitle2 text-weight-medium q-mb-sm">Status Distribution</div>
              <q-list>
                <q-item v-for="(count, status) in locationStatistics.byStatus" :key="status">
                  <q-item-section>
                    <q-item-label>{{ status }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge :color="getLocationStatusColor(status)" :label="count" />
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <!-- Type Distribution -->
            <div class="col-md-6 col-xs-12">
              <div class="text-subtitle2 text-weight-medium q-mb-sm">Type Distribution</div>
              <q-list>
                <q-item v-for="(count, type) in locationStatistics.byType" :key="type">
                  <q-item-section>
                    <q-item-label>{{ type }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge color="secondary" :label="count" />
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>

          <!-- Security Level Distribution -->
          <div class="q-mt-md" v-if="Object.keys(locationStatistics.bySecurityLevel || {}).length > 0">
            <div class="text-subtitle2 text-weight-medium q-mb-sm">Security Level Distribution</div>
            <div class="row q-gutter-sm">
              <q-chip
                v-for="(count, level) in locationStatistics.bySecurityLevel"
                :key="level"
                :color="getSecurityLevelColor(level)"
                text-color="white"
                :icon="getSecurityLevelIcon(level)"
              >
                {{ level }}: {{ count }}
              </q-chip>
            </div>
          </div>

          <!-- Capabilities Summary -->
          <div class="q-mt-md">
            <div class="text-subtitle2 text-weight-medium q-mb-sm">Capabilities Summary</div>
            <div class="row q-gutter-md">
              <q-card flat bordered class="col">
                <q-card-section class="text-center">
                  <div class="text-h6 text-primary">{{ locationStatistics.inventoryCapable || 0 }}</div>
                  <div class="text-caption">Inventory Capable</div>
                </q-card-section>
              </q-card>
              <q-card flat bordered class="col">
                <q-card-section class="text-center">
                  <div class="text-h6 text-positive">{{ locationStatistics.receivingCapable || 0 }}</div>
                  <div class="text-caption">Receiving Capable</div>
                </q-card-section>
              </q-card>
              <q-card flat bordered class="col">
                <q-card-section class="text-center">
                  <div class="text-h6 text-warning">{{ locationStatistics.issuingCapable || 0 }}</div>
                  <div class="text-caption">Issuing Capable</div>
                </q-card-section>
              </q-card>
              <q-card flat bordered class="col">
                <q-card-section class="text-center">
                  <div class="text-h6 text-info">{{ locationStatistics.projectLocations || 0 }}</div>
                  <div class="text-caption">Project Locations</div>
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
        <q-bar class="bg-info text-white">
          <div class="text-h6">Export Locations</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-bar>

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
              :label="`Export Selected Only (${selectedLocations.length} locations)`"
              :disable="selectedLocations.length === 0"
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
                ? `Are you sure you want to delete ${selectedLocations.length} selected locations?`
                : `Are you sure you want to delete "${deleteTarget?.locationName}"?`
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
import { useLocationsStore } from 'stores/locations'
import { useProjectStore } from 'stores/project'
import { debounce } from 'lodash'

const $q = useQuasar()

// Stores
const locationsStore = useLocationsStore()
const projectStore = useProjectStore()

// Reactive data
const searchTerm = ref('')
const showAdvancedFilters = ref(false)
const showCreateDialog = ref(false)
const showDetailsDialog = ref(false)
const showAnalyticsDialog = ref(false)
const showExportDialog = ref(false)
const showDeleteConfirmDialog = ref(false)
const selectedLocations = ref([])
const selectedLocation = ref(null)
const deleteTarget = ref(null)
const deleteTargetMultiple = ref(false)
const editingLocation = ref(null)
const isGeneratingCode = ref(false)

// Form data
const locationForm = ref({
  locationCode: '',
  locationName: '',
  locationType: 'Warehouse',
  locationStatus: 'Active',
  projectNodeId: null,
  address: '',
  city: '',
  state: '',
  country: 'India',
  pinCode: '',
  latitude: null,
  longitude: null,
  contactPersonName: '',
  contactPhone: '',
  contactEmail: '',
  isInventoryLocation: true,
  isReceivingLocation: true,
  isIssuingLocation: true,
  securityLevel: 'Standard',
  facilitiesAvailable: '',
  accessRestrictions: '',
  locationNotes: ''
})

// Export options
const exportFormat = ref('EXCEL')
const includeMetadata = ref(true)
const exportSelectedOnly = ref(false)

// Pagination
const pagination = ref({
  sortBy: 'locationName',
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0
})

// Computed
const isLoading = computed(() => locationsStore.isLoading)
const filteredLocations = computed(() => locationsStore.filteredLocations)
const locationStatistics = computed(() => locationsStore.locationsStatistics)
const filters = computed(() => locationsStore.filters)

const projectOptions = computed(() => {
  return projectStore.projects
    .filter(project => {
      // Filter for projects with tree category "Project"
      const categories = projectStore.categories || []
      const category = categories.find(cat => cat.recCode === project.treeCategoryId)
      return category?.categoryName === 'Project'
    })
    .map(project => ({
      label: project.nodeName,
      value: project.recCode
    }))
})

const locationTypeOptions = [
  { label: 'Project', value: 'Project' },
  { label: 'Office', value: 'Office' },
  { label: 'Department', value: 'Department' },
  { label: 'Warehouse', value: 'Warehouse' }
]

const statusOptions = [
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
  { label: 'Under Construction', value: 'UnderConstruction' }
]

const securityLevelOptions = [
  { label: 'High', value: 'High' },
  { label: 'Standard', value: 'Standard' },
  { label: 'Basic', value: 'Basic' }
]

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
    name: 'locationCode',
    label: 'Location Code',
    align: 'left',
    field: 'locationCode',
    sortable: true
  },
  {
    name: 'locationName',
    label: 'Location Name',
    align: 'left',
    field: 'locationName',
    sortable: true
  },
  {
    name: 'locationType',
    label: 'Type',
    align: 'left',
    field: 'locationType',
    sortable: true
  },
  {
    name: 'status',
    label: 'Status',
    align: 'center',
    field: 'locationStatus',
    sortable: true
  },
  {
    name: 'project',
    label: 'Project',
    align: 'left',
    field: 'projectNodeName',
    sortable: true
  },
  {
    name: 'capabilities',
    label: 'Capabilities',
    align: 'center',
    field: 'capabilities',
    sortable: false
  },
  {
    name: 'location',
    label: 'Location',
    align: 'left',
    field: 'city',
    sortable: true
  },
  {
    name: 'contact',
    label: 'Contact',
    align: 'left',
    field: 'contactPersonName',
    sortable: true
  },
  {
    name: 'security',
    label: 'Security',
    align: 'center',
    field: 'securityLevel',
    sortable: true
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
  locationsStore.setFilters({ search: value })
  applyFilters()
}, 300)

const applyFilters = async () => {
  try {
    await locationsStore.searchLocations(
      searchTerm.value,
      locationsStore.filters,
      {
        page: 0,
        size: pagination.value.rowsPerPage
      }
    )
    pagination.value.rowsNumber = locationsStore.totalLocations
  } catch (error) {
    console.error('Search failed:', error)
  }
}

const clearAllFilters = () => {
  searchTerm.value = ''
  locationsStore.clearFilters()
  fetchLocations()
}

const onRequest = async (props) => {
  const { page, rowsPerPage, sortBy, descending } = props.pagination

  try {
    await locationsStore.fetchLocations({
      page: page - 1,
      size: rowsPerPage,
      sort: sortBy,
      direction: descending ? 'DESC' : 'ASC'
    })

    pagination.value.page = page
    pagination.value.rowsPerPage = rowsPerPage
    pagination.value.sortBy = sortBy
    pagination.value.descending = descending
    pagination.value.rowsNumber = locationsStore.totalLocations
  } catch (error) {
    console.error('Failed to fetch locations:', error)
  }
}

const fetchLocations = async () => {
  try {
    await locationsStore.fetchLocations({
      page: pagination.value.page - 1,
      size: pagination.value.rowsPerPage
    })
    pagination.value.rowsNumber = locationsStore.totalLocations
  } catch (error) {
    console.error('Failed to fetch locations:', error)
  }
}

const editLocation = (location) => {
  editingLocation.value = location
  locationForm.value = { ...location }
  showCreateDialog.value = true
  showDetailsDialog.value = false
}

const viewLocation = (location) => {
  selectedLocation.value = location
  showDetailsDialog.value = true
}

const confirmDelete = (location) => {
  deleteTarget.value = location
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
      for (const location of selectedLocations.value) {
        await locationsStore.deleteLocation(location.recCode)
      }
      selectedLocations.value = []
    } else {
      await locationsStore.deleteLocation(deleteTarget.value.recCode)
    }
    showDeleteConfirmDialog.value = false
    await fetchLocations()
  } catch (error) {
    console.error('Delete failed:', error)
  }
}

const generateLocationCode = async () => {
  isGeneratingCode.value = true
  try {
    // Generate location code based on type
    const prefix = getLocationCodePrefix(locationForm.value.locationType)
    const count = locationsStore.locations.length
    locationForm.value.locationCode = `${prefix}${String(count + 1).padStart(4, '0')}`
  } catch (error) {
    console.error('Failed to generate location code:', error)
  } finally {
    isGeneratingCode.value = false
  }
}

const getLocationCodePrefix = (locationType) => {
  const prefixMap = {
    'Project': 'PRJ',
    'Office': 'OFF',
    'Department': 'DEPT',
    'Warehouse': 'WH'
  }
  return prefixMap[locationType] || 'LOC'
}

const saveLocation = async () => {
  try {
    if (editingLocation.value) {
      await locationsStore.updateLocation(editingLocation.value.recCode, locationForm.value)
    } else {
      await locationsStore.createLocation(locationForm.value)
    }

    showCreateDialog.value = false
    resetForm()
    await fetchLocations()
  } catch (error) {
    console.error('Save failed:', error)
  }
}

const resetForm = () => {
  editingLocation.value = null
  locationForm.value = {
    locationCode: '',
    locationName: '',
    locationType: 'Warehouse',
    locationStatus: 'Active',
    projectNodeId: null,
    address: '',
    city: '',
    state: '',
    country: 'India',
    pinCode: '',
    latitude: null,
    longitude: null,
    contactPersonName: '',
    contactPhone: '',
    contactEmail: '',
    isInventoryLocation: true,
    isReceivingLocation: true,
    isIssuingLocation: true,
    securityLevel: 'Standard',
    facilitiesAvailable: '',
    accessRestrictions: '',
    locationNotes: ''
  }
}

const performExport = async () => {
  try {
    const locationIds = exportSelectedOnly.value && selectedLocations.value.length > 0
      ? selectedLocations.value.map(location => location.recCode)
      : null

    // Implementation would depend on your export service
    console.log('Exporting locations:', locationIds, exportFormat.value, includeMetadata.value)

    showExportDialog.value = false
    $q.notify({
      type: 'positive',
      message: 'Export initiated successfully',
      position: 'top'
    })
  } catch (error) {
    console.error('Export failed:', error)
  }
}

const hasCapabilities = (location) => {
  return location.isInventoryLocation || location.isReceivingLocation || location.isIssuingLocation
}

// Utility methods
const getLocationTypeIcon = (locationType) => locationsStore.getLocationTypeIcon(locationType)
const getLocationStatusColor = (status) => locationsStore.getLocationStatusColor(status)
const getSecurityLevelColor = (securityLevel) => locationsStore.getSecurityLevelColor(securityLevel)

const getSecurityLevelIcon = (securityLevel) => {
  const iconMap = {
    'High': 'security',
    'Standard': 'verified_user',
    'Basic': 'shield'
  }
  return iconMap[securityLevel] || 'shield'
}

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
      locationsStore.fetchLocations(),
      projectStore.fetchProjects(),
      projectStore.fetchCategories()
    ])

    pagination.value.rowsNumber = locationsStore.totalLocations
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
