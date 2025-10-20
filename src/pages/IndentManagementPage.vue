<template>
  <q-page class="indent-management">
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-info">
            <h4 class="page-title">Indent Management</h4>
            <p class="page-subtitle">
              Manage project material indents and requests
            </p>
          </div>
          <div class="header-actions">
            <q-btn
              icon="add"
              label="Create Indent"
              color="primary"
              @click="showCreateDialog = true"
              class="create-btn"
            />
            <q-btn
              icon="refresh"
              label="Refresh"
              outline
              color="primary"
              @click="loadIndents"
              :loading="isLoading"
              class="refresh-btn"
            />
          </div>
        </div>
      </div>

      <!-- Search Box -->
      <q-card flat class="search-card">
        <q-card-section>
          <q-input
            v-model="searchTerm"
            placeholder="Search indents by number, title, remarks..."
            filled
            dense
            debounce="500"
            @update:model-value="loadIndents"
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </q-card-section>
      </q-card>

      <!-- Indents Table -->
      <q-card flat class="table-card">
        <q-table
          :rows="indents"
          :columns="columns"
          :loading="isLoading"
          :pagination="pagination"
          row-key="recCode"
          flat
          @request="onTableRequest"
          class="indents-table"
        >
          <!-- Indent Number & Date -->
          <template v-slot:body-cell-indentNumber="props">
            <q-td :props="props">
              <div class="indent-info">
                <div class="indent-number">{{ props.row.indentNumber }}</div>
                <div class="indent-date">
                  {{ formatDate(props.row.requestedDate) }}
                </div>
              </div>
            </q-td>
          </template>

          <!-- Location -->
          <template v-slot:body-cell-location="props">
            <q-td :props="props">
              <div class="location-info">
                <q-icon name="location_on" size="xs" class="location-icon" />
                <span>{{ props.row.locationName || "-" }}</span>
              </div>
            </q-td>
          </template>

          <!-- Items Count -->
          <template v-slot:body-cell-itemsCount="props">
            <q-td :props="props">
              <div class="items-count">
                <q-badge color="primary" rounded>
                  {{ props.row.totalItemsCount || 0 }} items
                </q-badge>
              </div>
            </q-td>
          </template>

          <!-- Status -->
          <template v-slot:body-cell-approvalStatus="props">
            <q-td :props="props">
              <q-chip
                :color="getStatusColor(props.row.approvalStatus)"
                text-color="white"
                size="sm"
                dense
                class="status-chip"
              >
                {{ props.row.approvalStatus }}
              </q-chip>
            </q-td>
          </template>

          <!-- Actions -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <div class="action-buttons-row">
                <q-btn
                  icon="edit"
                  size="sm"
                  flat
                  round
                  dense
                  color="primary"
                  @click="editIndent(props.row)"
                >
                  <q-tooltip>Edit Indent</q-tooltip>
                </q-btn>
                <q-btn
                  icon="visibility"
                  size="sm"
                  flat
                  round
                  dense
                  color="info"
                  @click="showIndentDetails(props.row)"
                >
                  <q-tooltip>View Details</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>

          <!-- No Data -->
          <template v-slot:no-data>
            <div class="no-data">
              <q-icon size="3em" name="inventory_2" color="grey-4" />
              <div class="no-data-text">No indent data available yet</div>
              <q-btn
                color="primary"
                label="Create First Indent"
                @click="showCreateDialog = true"
                class="q-mt-md"
              />
            </div>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- Create/Edit Indent Dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card
        class="create-indent-dialog"
        style="min-width: 800px; max-width: 90vw"
      >
        <q-bar class="dialog-bar">
          <q-icon name="add_circle" />
          <div class="bar-title">
            {{ isEditing ? "Edit Indent" : "Create New Indent" }}
          </div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section class="dialog-content">
          <q-form @submit="saveIndent" class="indent-form">
            <!-- Basic Information Section -->
            <div class="form-section">
              <div class="section-title">Basic Information</div>
              <div class="form-grid">
                <q-input
                  v-model="indentForm.indentNumber"
                  label="Indent No. *"
                  filled
                  dense
                  :rules="[(val) => !!val || 'Indent number is required']"
                  :readonly="isEditing"
                />

                <q-input
                  v-model="indentForm.requestedDate"
                  label="Indent Date *"
                  filled
                  dense
                  type="date"
                  :rules="[(val) => !!val || 'Indent date is required']"
                />

                <q-select
                  v-model="indentForm.locationId"
                  :options="locationOptions"
                  label="Location *"
                  filled
                  dense
                  emit-value
                  map-options
                  :rules="[(val) => !!val || 'Location is required']"
                />

                <q-input
                  v-model="indentForm.indentNotes"
                  label="Remarks"
                  filled
                  dense
                  type="textarea"
                  rows="2"
                />
              </div>
            </div>

            <!-- Indent Items Section -->
            <div class="form-section">
              <div class="section-title-with-action">
                <div class="section-title">Indent Items</div>
                <q-btn
                  icon="add"
                  label="Add Item"
                  color="primary"
                  @click="addNewItem"
                  size="sm"
                  outline
                />
              </div>

              <div class="items-container">
                <q-card
                  v-for="(item, index) in indentForm.indentItems"
                  :key="index"
                  flat
                  bordered
                  class="item-card"
                >
                  <q-card-section>
                    <div class="item-header">
                      <div class="item-title">Item {{ index + 1 }}</div>
                      <q-btn
                        icon="delete"
                        size="sm"
                        flat
                        round
                        dense
                        color="negative"
                        @click="removeItem(index)"
                        v-if="indentForm.indentItems.length > 1"
                      >
                        <q-tooltip>Remove Item</q-tooltip>
                      </q-btn>
                    </div>

                    <div class="item-form-grid">
                      <q-select
                        v-model="item.itemMasterId"
                        :options="itemOptions"
                        label="Item *"
                        filled
                        dense
                        emit-value
                        map-options
                        :rules="[(val) => !!val || 'Item is required']"
                      />

                      <q-input
                        v-model.number="item.requiredQuantity"
                        label="Quantity *"
                        filled
                        dense
                        type="number"
                        :rules="[
                          (val) => val > 0 || 'Quantity must be greater than 0',
                        ]"
                      />

                      <q-select
                        v-model="item.unit"
                        :options="unitOptions"
                        label="Unit *"
                        filled
                        dense
                        emit-value
                        map-options
                        :rules="[(val) => !!val || 'Unit is required']"
                      />

                      <q-input
                        v-model="item.requiredByDate"
                        label="Required By Date"
                        filled
                        dense
                        type="date"
                      />

                      <q-input
                        v-model="item.itemNotes"
                        label="Item Notes"
                        filled
                        dense
                        type="textarea"
                        rows="1"
                      />
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="form-actions">
              <q-btn
                type="submit"
                color="primary"
                :label="isEditing ? 'Update Indent' : 'Create Indent'"
                :loading="isSaving"
                icon="save"
              />
              <q-btn
                flat
                label="Cancel"
                @click="cancelIndent"
                :disable="isSaving"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Indent Details Modal -->
    <q-dialog v-model="showDetailsDialog" persistent>
      <q-card
        class="indent-details-dialog"
        style="min-width: 600px; max-width: 80vw"
      >
        <q-bar class="dialog-bar">
          <q-icon name="description" />
          <div class="bar-title">
            Indent Details - {{ selectedIndent?.indentNumber }}
          </div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section class="dialog-content" v-if="selectedIndent">
          <div class="overview-content">
            <div class="overview-details">
              <div class="detail-group">
                <label>Indent Number:</label>
                <span class="indent-number">{{
                  selectedIndent.indentNumber
                }}</span>
              </div>

              <div class="detail-group">
                <label>Indent Date:</label>
                <span>{{ formatDate(selectedIndent.requestedDate) }}</span>
              </div>

              <div class="detail-group">
                <label>Location:</label>
                <span>{{ selectedIndent.locationName || "-" }}</span>
              </div>

              <div class="detail-group">
                <label>Status:</label>
                <q-chip
                  :color="getStatusColor(selectedIndent.approvalStatus)"
                  text-color="white"
                  size="sm"
                >
                  {{ selectedIndent.approvalStatus }}
                </q-chip>
              </div>

              <div
                v-if="selectedIndent.indentNotes"
                class="detail-group full-width"
              >
                <label>Remarks:</label>
                <span>{{ selectedIndent.indentNotes }}</span>
              </div>
            </div>

            <!-- Items Table -->
            <div class="items-section">
              <h6 class="section-title">
                Indent Items ({{ selectedIndentItems?.length || 0 }})
              </h6>
              <q-table
                :rows="selectedIndentItems || []"
                :columns="itemColumns"
                flat
                bordered
                class="items-table"
              >
                <template v-slot:body-cell-itemName="props">
                  <q-td :props="props">
                    <div class="item-info">
                      <div class="item-name">
                        {{ props.row.itemName || "N/A" }}
                      </div>
                    </div>
                  </q-td>
                </template>

                <template v-slot:body-cell-quantity="props">
                  <q-td :props="props">
                    <div class="quantity-info">
                      <span class="quantity">{{
                        props.row.requiredQuantity
                      }}</span>
                      <span class="unit">{{ props.row.unit }}</span>
                    </div>
                  </q-td>
                </template>

                <template v-slot:no-data>
                  <div class="no-items">
                    <q-icon name="inventory_2" size="2em" color="grey-4" />
                    <div>No items added to this indent</div>
                  </div>
                </template>
              </q-table>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useIndentsStore } from "stores/indents";
import { useLocationsStore } from "stores/locations";
import { useItemsStore } from "stores/items";
import { useUnitsStore } from "stores/units";
import { useAuthStore } from "stores/auth";
import { showSuccess, showError } from "src/utils/notification";

export default {
  name: "IndentManagement",

  setup() {
    const indentsStore = useIndentsStore();
    const locationsStore = useLocationsStore();
    const itemsStore = useItemsStore();
    const unitsStore = useUnitsStore();
    const authStore = useAuthStore();

    // Get current user from auth store
    const currentUser = computed(() => authStore.currentUser);
    const currentUserId = computed(
      () => currentUser.value?.id || currentUser.value?.recCode
    );

    // Reactive data
    const isLoading = ref(false);
    const isSaving = ref(false);
    const isEditing = ref(false);
    const searchTerm = ref("");

    // Dialogs
    const showCreateDialog = ref(false);
    const showDetailsDialog = ref(false);
    const selectedIndent = ref(null);
    const selectedIndentItems = ref([]);

    // Indent form
    const indentForm = ref({
      indentNumber: "",
      indentTitle: "Material Indent",
      indentDescription: "Materials required for project work",
      indentType: "Material",
      priority: "Normal",
      projectNodeId: "",
      locationId: null,
      requestedById: currentUserId.value,
      requestorDepartment: "Engineering",
      requestedDate: new Date().toISOString().split("T")[0],
      requiredByDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      purposeOfIndent: "Project requirements",
      workDescription: "General construction work",
      justification: "As per project schedule",
      estimatedBudget: 0,
      budgetCode: "PROJ-2025-001",
      requiresApproval: true,
      isUrgent: false,
      deliveryInstructions: "Deliver to site",
      qualityRequirements: "Standard quality materials",
      indentNotes: "",
      indentItems: [
        {
          itemMasterId: null,
          requiredQuantity: 1,
          unit: "",
          estimatedRate: 0,
          estimatedAmount: 0,
          requiredByDate: "",
          isTestingRequired: false,
          purposeOfItem: "Project requirement",
          itemNotes: "",
        },
      ],
    });

    // Table configuration
    const pagination = ref({
      page: 1,
      rowsPerPage: 10,
      rowsNumber: 0,
      sortBy: "requestedDate",
      descending: true,
    });

    const columns = [
      {
        name: "indentNumber",
        required: true,
        label: "Indent No.",
        align: "left",
        field: "indentNumber",
        sortable: true,
      },
      {
        name: "requestedDate",
        align: "left",
        label: "Date",
        field: "requestedDate",
        sortable: true,
        format: (val) => formatDate(val),
      },
      {
        name: "location",
        align: "left",
        label: "Location",
        field: "locationName",
        sortable: true,
      },
      {
        name: "itemsCount",
        align: "center",
        label: "Total Items",
        field: "totalItemsCount",
        sortable: true,
      },
      {
        name: "indentNotes",
        align: "left",
        label: "Remarks",
        field: "indentNotes",
        sortable: true,
      },
      {
        name: "approvalStatus",
        align: "center",
        label: "Status",
        field: "approvalStatus",
        sortable: true,
      },
      {
        name: "actions",
        align: "center",
        label: "Actions",
        field: "actions",
        sortable: false,
      },
    ];

    const itemColumns = [
      {
        name: "itemName",
        label: "Item Name",
        field: "itemName",
        align: "left",
      },
      {
        name: "quantity",
        label: "Quantity",
        field: "requiredQuantity",
        align: "center",
      },
      {
        name: "unit",
        label: "Unit",
        field: "unit",
        align: "center",
      },
      {
        name: "requiredByDate",
        label: "Required By",
        field: "requiredByDate",
        align: "center",
        format: (val) => formatDate(val),
      },
      {
        name: "itemNotes",
        label: "Notes",
        field: "itemNotes",
        align: "left",
      },
    ];

    // Computed properties
    const indents = computed(() => indentsStore.indents || []);
    const locationOptions = computed(() => {
      return (locationsStore.locations || []).map((location) => ({
        label: location.locationName,
        value: location.recCode,
      }));
    });
    const itemOptions = computed(() => {
      return (itemsStore.items || []).map((item) => ({
        label: item.itemName,
        value: item.recCode,
      }));
    });
    const unitOptions = computed(() => {
      return (unitsStore.units || []).map((unit) => ({
        label: `${unit.unitName} (${unit.unitSymbol})`,
        value: unit.unitSymbol,
      }));
    });

    // Utility functions
    const formatDate = (dateString) => {
      if (!dateString) return "-";
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN");
      } catch (error) {
        console.error("Date formatting error:", error);
        return "-";
      }
    };

    const getStatusColor = (status) => {
      const colorMap = {
        Pending: "orange",
        Approved: "green",
        Rejected: "red",
        InProgress: "blue",
        Cancelled: "grey",
      };
      return colorMap[status] || "primary";
    };

    const generateIndentNumber = async () => {
      try {
        const response = await indentsStore.generateIndentNumber();
        return (
          response.data ||
          `IND-${new Date().getFullYear()}${String(
            new Date().getMonth() + 1
          ).padStart(2, "0")}-${Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0")}`
        );
      } catch (error) {
        console.error("Failed to generate indent number:", error);
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const random = Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0");
        return `IND-${year}${month}-${random}`;
      }
    };

    // Form functions
    const addNewItem = () => {
      indentForm.value.indentItems.push({
        itemMasterId: null,
        requiredQuantity: 1,
        unit: "",
        estimatedRate: 0,
        estimatedAmount: 0,
        requiredByDate: "",
        isTestingRequired: false,
        purposeOfItem: "Project requirement",
        itemNotes: "",
      });
    };

    const removeItem = (index) => {
      if (indentForm.value.indentItems.length > 1) {
        indentForm.value.indentItems.splice(index, 1);
      }
    };

    // Reset form
    const resetIndentForm = async () => {
      indentForm.value = {
        indentNumber: await generateIndentNumber(),
        indentTitle: "Material Indent",
        indentDescription: "Materials required for project work",
        indentType: "Material",
        priority: "Normal",
        projectNodeId: "", 
        locationId: null,
        requestedById: currentUserId.value,
        requestorDepartment: "Engineering",
        requestedDate: new Date().toISOString().split("T")[0],
        requiredByDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        purposeOfIndent: "Project requirements",
        workDescription: "General construction work",
        justification: "As per project schedule",
        estimatedBudget: 0,
        budgetCode: "PROJ-2025-001",
        requiresApproval: true,
        isUrgent: false,
        deliveryInstructions: "Deliver to site",
        qualityRequirements: "Standard quality materials",
        indentNotes: "",
        indentItems: [
          {
            itemMasterId: null,
            requiredQuantity: 1,
            unit: "",
            estimatedRate: 0,
            estimatedAmount: 0,
            requiredByDate: "",
            isTestingRequired: false,
            purposeOfItem: "Project requirement",
            itemNotes: "",
          },
        ],
      };
    };

    // Data loading functions
    const loadIndents = async () => {
      isLoading.value = true;
      try {
        const params = {
          page: pagination.value.page - 1,
          size: pagination.value.rowsPerPage,
          sort: pagination.value.sortBy,
          direction: pagination.value.descending ? "DESC" : "ASC",
        };

        let response;
        if (searchTerm.value) {
          response = await indentsStore.searchIndents(searchTerm.value, params);
        } else {
          response = await indentsStore.fetchIndents(params);
        }

        if (response && response.data) {
          pagination.value.rowsNumber =
            response.data.totalElements || indents.value.length;
        }
      } catch (error) {
        showError("Failed to load indents");
        console.error("Error loading indents:", error);
      } finally {
        isLoading.value = false;
      }
    };

    const loadMasterData = async () => {
      try {
        await Promise.all([
          locationsStore.fetchLocations(),
          itemsStore.fetchItems(),
          unitsStore.fetchUnits(),
        ]);
      } catch (error) {
        console.error("Failed to load master data:", error);
      }
    };

    // Table functions
    const onTableRequest = (props) => {
      if (props.pagination) {
        pagination.value.page = props.pagination.page;
        pagination.value.rowsPerPage = props.pagination.rowsPerPage;
      }
      loadIndents();
    };

    // Indent actions
    const showIndentDetails = async (indent) => {
      selectedIndent.value = indent;
      try {
        selectedIndentItems.value = await indentsStore.fetchIndentItems(
          indent.recCode
        );
      } catch (error) {
        console.error("Failed to load indent items:", error);
        selectedIndentItems.value = [];
      }
      showDetailsDialog.value = true;
    };

    const editIndent = async (indent) => {
      if (!indent) return;

      try {
        isEditing.value = true;
        selectedIndent.value = indent;

        console.log(
          "Available indentsStore methods:",
          Object.keys(indentsStore)
        );

        let fullIndentResponse;
        let itemsResponse;

        // Method 1: Try fetchIndentById
        if (typeof indentsStore.fetchIndentById === "function") {
          fullIndentResponse = await indentsStore.fetchIndentById(
            indent.recCode
          );
        }
        // Method 2: Try getIndent
        else if (typeof indentsStore.getIndent === "function") {
          fullIndentResponse = await indentsStore.getIndent(indent.recCode);
        }
        // Method 3: Try findIndentById
        else if (typeof indentsStore.findIndentById === "function") {
          fullIndentResponse = await indentsStore.findIndentById(
            indent.recCode
          );
        }
        // Method 4: Use the data we already have from the table
        else {
          console.log("Using existing indent data from table");
          fullIndentResponse = { success: true, data: indent };
        }

        // Get items - try different method names
        if (typeof indentsStore.fetchIndentItems === "function") {
          itemsResponse = await indentsStore.fetchIndentItems(indent.recCode);
        } else if (typeof indentsStore.getIndentItems === "function") {
          itemsResponse = await indentsStore.getIndentItems(indent.recCode);
        } else {
          console.log("No items method found, using empty array");
          itemsResponse = [];
        }

        // Handle response format
        const fullIndent =
          fullIndentResponse?.data || fullIndentResponse || indent;
        const items = itemsResponse || [];

        console.log("Editing indent data:", fullIndent);
        console.log("Indent items:", items);

        // Map the data to match form structure
        indentForm.value = {
          indentNumber: fullIndent.indentNumber,
          indentTitle: fullIndent.indentTitle,
          indentDescription: fullIndent.indentDescription,
          indentType: fullIndent.indentType,
          priority: fullIndent.priority,
          projectNodeId: fullIndent.projectNodeId,
          locationId: fullIndent.locationId,
          requestedById: currentUserId.value,
          requestorDepartment: fullIndent.requestorDepartment,
          requestedDate:
            fullIndent.requestedDate?.split("T")[0] ||
            new Date().toISOString().split("T")[0],
          requiredByDate:
            fullIndent.requiredByDate?.split("T")[0] ||
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
          purposeOfIndent: fullIndent.purposeOfIndent,
          workDescription: fullIndent.workDescription,
          justification: fullIndent.justification,
          estimatedBudget: fullIndent.estimatedBudget || 0,
          budgetCode: fullIndent.budgetCode,
          requiresApproval: fullIndent.requiresApproval !== false,
          isUrgent: fullIndent.isUrgent || false,
          deliveryInstructions: fullIndent.deliveryInstructions,
          qualityRequirements: fullIndent.qualityRequirements,
          indentNotes: fullIndent.indentNotes || "",
          indentItems:
            items.length > 0
              ? items.map((item) => ({
                  itemMasterId: item.itemMasterId,
                  requiredQuantity: item.requiredQuantity,
                  unit: item.unit,
                  estimatedRate: item.estimatedRate || 0,
                  estimatedAmount: item.estimatedAmount || 0,
                  requiredByDate: item.requiredByDate?.split("T")[0] || "",
                  isTestingRequired: item.isTestingRequired || false,
                  purposeOfItem: item.purposeOfItem || "Project requirement",
                  itemNotes: item.itemNotes || "",
                }))
              : [
                  {
                    itemMasterId: null,
                    requiredQuantity: 1,
                    unit: "",
                    estimatedRate: 0,
                    estimatedAmount: 0,
                    requiredByDate: "",
                    isTestingRequired: false,
                    purposeOfItem: "Project requirement",
                    itemNotes: "",
                  },
                ],
        };

        showCreateDialog.value = true;
      } catch (error) {
        console.error("Failed to edit indent:", error);
        showError(
          "Failed to load indent data: " + (error.message || "Unknown error")
        );
      }
    };

    // Save indent function
    const saveIndent = async () => {
      isSaving.value = true;
      try {
        // Validate form
        if (
          !indentForm.value.indentItems ||
          indentForm.value.indentItems.length === 0
        ) {
          showError("At least one item is required");
          return;
        }

        if (!indentForm.value.locationId) {
          showError("Please select a location");
          return;
        }

        // Ensure we have a valid user ID
        if (!currentUserId.value) {
          showError("User not authenticated. Please login again.");
          return;
        }

        // Get projectNodeId from selected location
        const location = locationsStore.locations.find(
          (loc) => loc.recCode === indentForm.value.locationId
        );
        if (!location || !location.projectNodeId) {
          showError("Selected location does not have a valid project node ID");
          return;
        }

        // Calculate total estimated budget from items
        const totalBudget = indentForm.value.indentItems.reduce(
          (total, item) => {
            return total + (item.estimatedAmount || 0);
          },
          0
        );

        const indentData = {
          ...indentForm.value,
          requestedById: currentUserId.value,
          projectNodeId: location.projectNodeId,
          estimatedBudget: totalBudget > 0 ? totalBudget : 10000,
          requestedDate: indentForm.value.requestedDate,
          requiredByDate: indentForm.value.requiredByDate,
        };

        console.log("Sending indent data:", indentData);

        let response;
        if (isEditing.value && selectedIndent.value) {
          const updateData = {
            indentTitle: indentData.indentTitle,
            indentDescription: indentData.indentDescription,
            priority: indentData.priority,
            requiredByDate: indentData.requiredByDate,
            isUrgent: indentData.isUrgent,
            indentNotes: indentData.indentNotes,
            locationId: indentData.locationId,
          };

          response = await indentsStore.updateIndent(
            selectedIndent.value.recCode,
            updateData
          );
        } else {
          response = await indentsStore.createIndent(indentData);
        }

        if (response && response.success) {
          showSuccess(
            isEditing.value
              ? "Indent updated successfully"
              : "Indent created successfully"
          );
          showCreateDialog.value = false;
          await resetIndentForm();
          isEditing.value = false;
          selectedIndent.value = null;
          await loadIndents();
        } else {
          showError(response?.message || "Failed to save indent");
        }
      } catch (error) {
        showError(
          isEditing.value
            ? "Failed to update indent"
            : "Failed to create indent"
        );
        console.error("Save indent error:", error);
      } finally {
        isSaving.value = false;
      }
    };

    const cancelIndent = () => {
      showCreateDialog.value = false;
      resetIndentForm();
      isEditing.value = false;
      selectedIndent.value = null;
    };

    // Lifecycle
    onMounted(async () => {
      await resetIndentForm();
      await loadMasterData();
      await loadIndents();
    });

    return {
      // State
      isLoading,
      isSaving,
      isEditing,
      indents,
      searchTerm,

      // Dialogs
      showCreateDialog,
      showDetailsDialog,
      selectedIndent,
      selectedIndentItems,

      // Forms
      indentForm,

      // Table
      pagination,
      columns,
      itemColumns,

      // Options
      locationOptions,
      itemOptions,
      unitOptions,

      // User info
      currentUser,
      currentUserId,

      // Methods
      loadIndents,
      onTableRequest,

      // Utility
      formatDate,
      getStatusColor,

      // Form actions
      addNewItem,
      removeItem,
      saveIndent,
      cancelIndent,

      // Indent actions
      showIndentDetails,
      editIndent,
    };
  },
};
</script>

<style lang="scss" scoped>
.indent-management {
  background-color: #fafafa;
  min-height: 100vh;
}

.page-container {
  max-width: 100%;
  padding: 16px;
}

// Header
.page-header {
  margin-bottom: 24px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }

  .header-info {
    .page-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: #1a1a1a;
    }

    .page-subtitle {
      font-size: 0.9rem;
      color: #6b7280;
      margin: 0;
    }
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

// Search Card
.search-card {
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
}

// Table Card
.table-card {
  border-radius: 8px;
  border: 1px solid #e5e7eb;

  .indents-table {
    ::v-deep(.q-table th) {
      font-weight: 600;
      background: #f9fafb;
    }

    .indent-info {
      .indent-number {
        font-weight: 600;
        color: #1f2937;
      }

      .indent-date {
        font-size: 12px;
        color: #6b7280;
      }
    }

    .location-info {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .items-count {
      display: flex;
      justify-content: center;
    }

    .action-buttons-row {
      display: flex;
      gap: 4px;
      justify-content: center;
    }
  }

  .no-data {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    gap: 12px;

    .no-data-text {
      color: #6b7280;
    }
  }
}

// Dialog Styling
.create-indent-dialog,
.indent-details-dialog {
  .dialog-bar {
    background: #1976d2;
    color: white;
    padding: 8px 12px;

    .bar-title {
      font-size: 1rem;
      font-weight: 600;
    }
  }

  .dialog-content {
    padding: 0;
    max-height: 70vh;
    overflow-y: auto;
  }
}

// Indent Form Styling
.indent-form {
  padding: 20px;

  .form-section {
    margin-bottom: 24px;

    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
    }

    .section-title-with-action {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }
  }

  .items-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .item-card {
    border: 1px solid #e5e7eb;
    border-radius: 6px;

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #f3f4f6;

      .item-title {
        font-weight: 600;
        color: #374151;
      }
    }

    .item-form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
    }
  }

  .form-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 20px;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
  }
}

// Details Modal Styling
.overview-content {
  padding: 20px;

  .overview-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 20px;

    .detail-group {
      display: flex;
      flex-direction: column;
      gap: 4px;

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

      .indent-number {
        font-weight: 600;
      }
    }
  }

  .items-section {
    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 12px 0;
    }

    .items-table {
      ::v-deep(.q-table th) {
        background: #f9fafb;
        font-weight: 600;
      }

      .item-info .item-name {
        font-weight: 500;
      }

      .quantity-info {
        display: flex;
        align-items: center;
        gap: 4px;

        .quantity {
          font-weight: 600;
        }

        .unit {
          color: #6b7280;
          font-size: 12px;
        }
      }

      .no-items {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 30px;
        gap: 8px;
        color: #6b7280;
      }
    }
  }
}

// Responsive Design
@media (max-width: 768px) {
  .page-container {
    padding: 12px;
  }

  .page-header .header-content {
    flex-direction: column;
    gap: 12px;
  }

  .create-indent-dialog,
  .indent-details-dialog {
    margin: 8px;
  }

  .indent-form {
    padding: 16px;

    .form-grid,
    .item-form-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
