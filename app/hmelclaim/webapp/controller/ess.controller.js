sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/Device",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/format/DateFormat",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/m/upload/UploadSetwithTable",
    "sap/m/upload/UploadSetwithTableItem",

],

    function (Controller, Device, JSONModel, MessageBox, DateFormat, ODataModel, UploadSetwithTable, UploadSetwithTableItem) {
        "use strict";

        return Controller.extend("hmel.claims.hmelclaim.controller.ess", {
            onInit: function () {
                Device.orientation.attachHandler(this.onOrientationChange, this);
                this._oModel = this.getView().getModel("MainModel");

                this.getView().setModel(new JSONModel({
                    isNextButtonVisible: true,
                    isSubmitButtonVisible: false
                }), "footerModel");

                var oIconTabBar = this.byId("myIconTabBar");
                oIconTabBar.attachSelect(this.onTabSelect, this);

                // Set initial visibility of buttons
                this.updateButtonVisibility();

                var oClaimModel = new JSONModel();
                this.getView().setModel(oClaimModel, "claimModel");

                this.updateTotalRequestedAmount();

                var oModel = new ODataModel("/odata/v4/my/");
                this.getView().setModel(oModel);

                var oComboBox = this.byId("Hospitallocation");
                oComboBox.attachChange(this.onHospitalLocationChange, this);

                var oComboBox = this.byId("TF");
                oComboBox.attachChange(this.onTreatmentChange, this);

                // this.oMockServer = new MockServer();
                // this.oMockServer.oModel = oModel;

            },
            formatDate: function (date) {
                if (!date) {
                    return "";
                }
                var oDateFormat = DateFormat.getDateTimeInstance({ pattern: "yyyy-MM-dd" });
                return oDateFormat.format(date);
            },
            onListItemPress: function (oEvent) {
                var listItem = oEvent.getParameter("listItem");

                if (listItem) {
                    var sToPageId = listItem.data("to");

                    if (sToPageId) {
                        this.getSplitAppObj().toDetail(this.createId(sToPageId));
                    } else {
                        console.error("Invalid destination for list item.");
                    }
                }
            },

            getSplitAppObj: function () {
                var view = this.getView();

                if (view) {
                    var splitContainer = view.byId("SplitContDemo");
                    return splitContainer;
                }

                return null;
            },

            onOrientationChange: function () {
                // Handle orientation change here if needed.
            },

            // handleNext: function () {
            //     var oIconTabBar = this.byId("myIconTabBar");
            //     var aItems = oIconTabBar.getItems();
            //     var sSelectedKey = oIconTabBar.getSelectedKey();

            //     var iCurrentIndex = aItems.findIndex(function (oItem) {
            //         return oItem.getKey() === sSelectedKey;
            //     });

            //     // Save data from the current tab to the claimModel
            //     this.saveDataToClaimModel();

            //     // Check if all required fields are filled in the current tab
            //     var aMissingFields = this.validateRequiredFields(sSelectedKey);

            //     if (aMissingFields.length === 0) {


            //         // Check if the CheckBox "Accept" is checked
            //         if (sSelectedKey === "Create") {
            //             var oCheckBoxAccept = this.byId("Accept");
            //             var bIsCheckBoxChecked = oCheckBoxAccept.getSelected();


            //             if (bIsCheckBoxChecked) {
            //                 // Proceed with the next logic
            //                 if (iCurrentIndex < aItems.length - 1) {
            //                     // Select the next tab
            //                     oIconTabBar.setSelectedKey(aItems[iCurrentIndex + 1].getKey());


            //                     // Update button visibility
            //                     this.updateButtonVisibility();
            //                 }
            //             } else {
            //                 // CheckBox is not checked, show an error message

            //                 MessageBox.error("Please acknowledge and accept the terms and conditions.");
            //             }
            //         } else {
            //             // Proceed with the next logic for other tabs
            //             if (iCurrentIndex < aItems.length - 1) {
            //                 // Select the next tab
            //                 oIconTabBar.setSelectedKey(aItems[iCurrentIndex + 1].getKey());

            //                 // Update button visibility
            //                 this.updateButtonVisibility();
            //             }
            //         }
            //     } else {
            //         // Show an error message with missing required fields

            //         var sErrorMessage = "Please fill in all required fields: " + aMissingFields.join(", ");
            //         MessageBox.error(sErrorMessage);
            //     }
            // },

            handleNext: function () {
                var oIconTabBar = this.byId("myIconTabBar");
                var aItems = oIconTabBar.getItems();
                var sSelectedKey = oIconTabBar.getSelectedKey();

                var iCurrentIndex = aItems.findIndex(function (oItem) {
                    return oItem.getKey() === sSelectedKey;
                });

                // Save data from the current tab to the claimModel
                this.saveDataToClaimModel();

                // Check if all required fields are filled in the current tab
                var aMissingFields = this.validateRequiredFields(sSelectedKey);

                if (aMissingFields.length === 0) {
                    // Check if the CheckBox "Accept" is checked
                    if (sSelectedKey === "Create") {
                        var oCheckBoxAccept = this.byId("Accept");
                        var bIsCheckBoxChecked = oCheckBoxAccept.getSelected();

                        if (!bIsCheckBoxChecked) {
                            // CheckBox is not checked, show an error message
                            MessageBox.error("Please acknowledge and accept the terms and conditions.");
                            return;
                        }
                    }

                    // Proceed with the next logic
                    if (iCurrentIndex < aItems.length - 1) {
                        // Select the next tab
                        oIconTabBar.setSelectedKey(aItems[iCurrentIndex + 1].getKey());

                        // Update button visibility
                        this.updateButtonVisibility();
                    }
                } else {
                    // Show an error message with missing required fields
                    var sErrorMessage = "Please fill in all required fields: " + aMissingFields.join(", ");
                    MessageBox.error(sErrorMessage);
                    return; // Stop further execution
                }

                // Execute AJAX call only if "claimDetails" is the first tab
                if (sSelectedKey === "claimDetails" && iCurrentIndex === 0) {
                    var startDate = this.byId("startDatePicker1").getDateValue().toISOString().split('T')[0];
                    var PolicyNumber = this.byId("PolicyNumber").getSelectedItem().getKey();
                    var illnessName = this.byId("TF").getSelectedKey();
                    $.ajax({
                        url: "/odata/v4/my/policyValidations(policyNumber='" + PolicyNumber + "',startDate=" + startDate + ",illnessName='" + illnessName + "')",
                        method: "GET",
                        success: function (data) {
                            if (data.value.success) {
                                oIconTabBar.setSelectedKey(aItems[iCurrentIndex + 1].getKey());
                            } else {
                                MessageBox.error(data.value.message);
                                oIconTabBar.setSelectedKey(sSelectedKey);
                            }
                        }

                    });
                }

            },


            validateRequiredFields: function (sSelectedKey) {
                var aMissingFields = [];

                if (sSelectedKey === "claimDetails") {
                    var oCT = this.byId("CT");
                    var oTT = this.byId("TT");
                    var oStartDatePicker1 = this.byId("startDatePicker1");
                    var oEndDatePicker1 = this.byId("endDatePicker1");
                    var oTF = this.byId("TF");
                    var oSD = this.byId("SD");

                    // Add more required fields as needed
                    if (!oCT.getValue()) {
                        aMissingFields.push("Claim Type");
                        oCT.setValueState("Error");
                    }
                    if (!oTT.getValue()) {
                        aMissingFields.push("Treatment Type");
                        oTT.setValueState("Error");
                    }
                    if (!oStartDatePicker1.getDateValue()) {
                        aMissingFields.push("Claim Start Date");
                        oStartDatePicker1.setValueState("Error");
                    }
                    if (!oEndDatePicker1.getDateValue()) {
                        aMissingFields.push("Claim End Date");
                        oEndDatePicker1.setValueState("Error");
                    }
                    if (!oTF.getValue()) {
                        aMissingFields.push("Treatment For");
                        oTF.setValueState("Error");
                    }
                    if (!oSD.getValue()) {
                        aMissingFields.push("Select Dependents");
                        oSD.setValueState("Error");
                    }
                }

                return aMissingFields;
            },


            handleBack: function () {
                var oIconTabBar = this.byId("myIconTabBar");
                var aItems = oIconTabBar.getItems();
                var iSelectedIndex = oIconTabBar.getSelectedKey();

                var iCurrentIndex = aItems.findIndex(function (oItem) {
                    return oItem.getKey() === iSelectedIndex;
                });

                if (iCurrentIndex > 0) {
                    oIconTabBar.setSelectedKey(aItems[iCurrentIndex - 1].getKey());
                    this.updateButtonVisibility();
                }
            },

            updateButtonVisibility: function () {
                var oIconTabBar = this.byId("myIconTabBar");
                var oBackButton = this.getView().byId("BackButton");
                var oNextButton = this.getView().byId("nextButton");
                var oSubmitButton = this.getView().byId("submitButton");
                var oSelectedTab = oIconTabBar.getSelectedKey();

                if (oSelectedTab === "review") {
                    oBackButton.setVisible(true);
                    oNextButton.setVisible(false);
                    oSubmitButton.setVisible(true);
                } else {
                    oBackButton.setVisible(true);
                    oNextButton.setVisible(true);
                    oSubmitButton.setVisible(false);
                }
            },


            onTabSelect: function (oEvent) {
                this.updateButtonVisibility();

                var sSelectedKey = oEvent.getParameter("key");

                // Perform validation based on the selected tab
                if (sSelectedKey === "claimDetails") {
                    // Validate claim details tab
                    var aMissingFields = this.validateRequiredFields(
                        this.byId("CT"),
                        this.byId("TT"),
                        this.byId("startDatePicker1"),
                        this.byId("endDatePicker1"),
                        this.byId("TF"),
                        this.byId("SD")
                    );

                    if (aMissingFields.length > 0) {
                        // Show an error message with missing required fields
                        var sErrorMessage = "Please fill in all required fields: " + aMissingFields.join(", ");
                        MessageBox.error(sErrorMessage);
                        // If validation fails, prevent switching to the selected tab
                        this.byId("myIconTabBar").setSelectedKey(this.sLastSelectedTab);
                        return;
                    }
                }

                // Continue with the normal logic for other tabs
                this.sLastSelectedTab = sSelectedKey;

                // Your existing logic for the selected tab
                if (sSelectedKey === "review") {
                    this.updateTotalRequestedAmount();
                }
            },


            saveDataToClaimModel: function () {
                var oClaimModel = this.getView().getModel("claimModel");

                // Set properties for Claim Type
                oClaimModel.setProperty("/claimType", this.byId("CT").getSelectedKey());

                // Set properties for Claim Start and End Dates
                oClaimModel.setProperty("/claimStartDate", this.byId("startDatePicker1").getValue());
                oClaimModel.setProperty("/claimEndDate", this.byId("endDatePicker1").getValue());

                // Set properties for Treatment For
                oClaimModel.setProperty("/treatmentFor", this.byId("TF").getSelectedKey());

                // Set properties for Treatment For (If Other)
                oClaimModel.setProperty("/treatmentForOther", this.byId("TreatmentForOther").getValue());

                // Set properties for Select Dependents
                oClaimModel.setProperty("/selectedDependent", this.byId("SD").getSelectedKey());
            },

            addPress: function () {
                // Get all the form values
                var startDate = this.byId("startDatePicker1").getDateValue();
                var startdatewithstring = startDate.toISOString();
                var startdate = startdatewithstring.split('T')[0];
                var endDate = this.byId("endDatePicker1").getDateValue();
                var endsatewithstring = endDate.toISOString();
                var enddate = endsatewithstring.split('T')[0];

                var category = this.byId("consultancycategorys").getSelectedKey();
                var doctor = this.byId("DN").getValue();
                var patientId = this.byId("ID").getValue();
                var hospitalStore = this.byId("HospitalStore").getSelectedKey();
                var hospitalLocation = this.byId("Hospitallocation").getSelectedKey();
                var hospitalLocationOther = this.byId("HL").getValue();
                var billDate = this.byId("billdate").getDateValue();
                var billNo = this.byId("billno").getValue();
                var billAmount = this.byId("billamount").getValue();
                var discount = this.byId("discount").getValue();
                var requestedAmount = this.byId("requestamount").getValue();
                var review = this.byId("description").getValue();

                // Initialize an array to store the names of missing fields
                var missingFields = [];

                // Perform validation checks for missing fields
                if (!doctor) missingFields.push("Doctor's Name");
                if (!patientId) missingFields.push("Patient ID");
                if (!hospitalStore) missingFields.push("Hospital/Medical Store");
                if (!hospitalLocation) missingFields.push("Hospital Location");
                if (!billDate) missingFields.push("Bill Date");
                if (!billNo) missingFields.push("Bill No");
                if (!billAmount) missingFields.push("Bill Amount(Rs)");
                if (!requestedAmount) missingFields.push("Requested Amount");

                // Check if any fields are missing
                if (missingFields.length > 0) {
                    // Display an error message with the list of missing fields
                    var errorMessage = "Please fill in the following required fields:\n" + missingFields.join("\n");
                    MessageBox.error(errorMessage);
                    return;
                }
                // AJAX call for additional validation
                $.ajax({
                    url: "/odata/v4/my/validations(endDate=" + enddate + ",startDate=" + startdate + ",requestedAmount=" + requestedAmount + `,category='` + category + `')`,
                    method: "GET",
                    success: function (data) {
                        // Check validation result
                        if (data.value.success) {
                            // Check if requested amount is greater than the final amount
                            if (requestedAmount > data.value.finalAmount) {
                                // Display MessageBox with eligible amount information
                                var eligibleAmountMessage = "Your eligible amount is: " + data.value.eligibleAmount;
                                MessageBox.information(eligibleAmountMessage, {
                                    onClose: function (oAction) {
                                        if (oAction === MessageBox.Action.OK) {
                                            // Create an object to hold the details
                                            var details = {
                                                category: category,
                                                doctor: doctor,
                                                patientId: patientId,
                                                hospitalStore: hospitalStore,
                                                hospitalLocation: hospitalLocation,
                                                hospitalLocationOther: hospitalLocationOther,
                                                billDate: billDate,
                                                billNo: billNo,
                                                billAmount: billAmount,
                                                discount: discount,
                                                requestedAmount: data.value.finalAmount,
                                                review: review,
                                            };

                                            // Add the details to the model
                                            var detailsModel = this.getView().getModel("claimModel");

                                            if (!detailsModel) {
                                                // If the model is not found, create it and set it to the view
                                                detailsModel = new sap.ui.model.json.JSONModel();
                                                this.getView().setModel(detailsModel, "claimModel");
                                            }

                                            // Get existing details or initialize an empty array
                                            var allDetails = detailsModel.getProperty("/allDetails") || [];

                                            // Add the new details
                                            allDetails.push(details);

                                            // Set the updated array back to the model
                                            detailsModel.setProperty("/allDetails", allDetails);

                                            // Clear the form
                                            this.clearForm();

                                            // Update total requested amount
                                            this.updateTotalRequestedAmount();
                                        }
                                    }.bind(this)
                                });
                            } else {
                                var details = {
                                    category: category,
                                    doctor: doctor,
                                    patientId: patientId,
                                    hospitalStore: hospitalStore,
                                    hospitalLocation: hospitalLocation,
                                    hospitalLocationOther: hospitalLocationOther,
                                    billDate: billDate,
                                    billNo: billNo,
                                    billAmount: billAmount,
                                    discount: discount,
                                    requestedAmount: requestedAmount,
                                    review: review,
                                };

                                // Add the details to the model
                                var detailsModel = this.getView().getModel("claimModel");

                                if (!detailsModel) {
                                    // If the model is not found, create it and set it to the view
                                    detailsModel = new sap.ui.model.json.JSONModel();
                                    this.getView().setModel(detailsModel, "claimModel");
                                }

                                // Get existing details or initialize an empty array
                                var allDetails = detailsModel.getProperty("/allDetails") || [];

                                // Add the new details
                                allDetails.push(details);

                                // Set the updated array back to the model
                                detailsModel.setProperty("/allDetails", allDetails);

                                // Clear the form
                                this.clearForm();

                                // Update total requested amount
                                this.updateTotalRequestedAmount();
                            }
                        } else {
                            // If validation fails, display error message
                            MessageBox.information(data.value.message);
                        }
                    }.bind(this),
                    error: function (error) {
                        // Handle error response
                        MessageBox.error("Error occurred while fetching data");
                    }
                });
            },


            clearForm: function () {
                this.byId("consultancycategorys").setSelectedKey("");
                this.byId("DN").setValue("");
                this.byId("ID").setValue("");
                this.byId("HospitalStore").setSelectedItem(null);
                this.byId("Hospitallocation").setSelectedItem(null);
                this.byId("HL").setValue("");
                this.byId("billdate").setValue(null);
                this.byId("billno").setValue("");
                this.byId("billamount").setValue("");
                this.byId("discount").setValue("");
                this.byId("requestamount").setValue("");
                this.byId("description").setValue("");
            },

            deletePress: function () {
                var list = this.byId("detailsList");
                var selectedItems = list.getSelectedItems();

                // Check if any items are selected
                if (selectedItems.length === 0) {
                    MessageBox.error("Please select an item to delete.");
                    return;
                }

                var confirmationText = "Are you sure you want to delete the selected item?";
                MessageBox.confirm(confirmationText, {
                    title: "Confirmation",
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.CANCEL,
                    onClose: function (action) {
                        if (action === MessageBox.Action.OK) {
                            // User clicked OK, proceed with deletion
                            this.deleteSelectedItems(selectedItems);
                        }
                    }.bind(this) // Ensure the proper 'this' context inside the onClose function
                });
            },

            deleteSelectedItems: function (selectedItems) {
                var detailsModel = this.getView().getModel("claimModel");
                var allDetails = detailsModel.getProperty("/allDetails");

                // Remove the selected items from the array
                selectedItems.forEach(function (item) {
                    var context = item.getBindingContext("claimModel");
                    var index = context.getPath().split("/").pop();
                    allDetails.splice(index, 1);
                });

                // Update the model with the modified array
                detailsModel.setProperty("/allDetails", allDetails);

                // Clear the selection in the list
                this.byId("detailsList").removeSelections();

                MessageBox.success("Selected items deleted successfully.");

                this.updateTotalRequestedAmount();
            },

            clonePress: function () {
                var list = this.byId("detailsList");
                var selectedItems = list.getSelectedItems();

                // Check if any items are selected
                if (selectedItems.length !== 1) {
                    MessageBox.error("Please select exactly one item to clone.");
                    return;
                }

                // Get the context of the selected item
                var selectedContext = selectedItems[0].getBindingContext("claimModel");

                // Get the data of the selected item from the model
                var selectedData = selectedContext.getProperty();

                // Clone the data (create a shallow copy)
                var clonedData = Object.assign({}, selectedData);

                // Set the form values directly with the cloned data
                this.setFormValues(clonedData);

                MessageBox.success("Item cloned successfully.");
                // Clear the selection in the list
                this.byId("detailsList").removeSelections();


            },


            setFormValues: function (details) {
                // Set form values directly
                this.byId("consultancycategorys").setSelectedKey(details.category);
                this.byId("DN").setValue(details.doctor);
                this.byId("ID").setValue(details.patientId);
                this.byId("HospitalStore").setSelectedKey(details.hospitalStore);
                this.byId("Hospitallocation").setSelectedKey(details.hospitalLocation);
                this.byId("HL").setValue(details.hospitalLocationOther);
                this.byId("billdate").setValue(new Date(details.billDate));
                this.byId("billno").setValue(details.billNo);
                this.byId("billamount").setValue(details.billAmount);
                this.byId("discount").setValue(details.discount);
                this.byId("requestamount").setValue(details.requestedAmount);
                this.byId("description").setValue(details.review);
            },

            EditPress: function () {
                var list = this.byId("detailsList");
                var selectedItems = list.getSelectedItems();

                if (selectedItems.length !== 1) {
                    MessageBox.error("Please select exactly one item to edit.");
                    return;
                }

                // Get the context of the selected item
                var selectedContext = selectedItems[0].getBindingContext("claimModel");

                // Get the data of the selected item from the model
                var selectedData = selectedContext.getProperty();

                // Set the form values directly with the selected data
                this.setFormValues(selectedData);

                // Show the Update and Cancel buttons, hide the Add, Delete, Edit, Clone buttons
                this.toggleButtonsVisibility(false, true, true, false, false);

                this.updateTotalRequestedAmount();
            },


            UpdatePress: function () {
                var list = this.byId("detailsList");
                var selectedItems = list.getSelectedItems();

                if (selectedItems.length !== 1) {
                    MessageBox.error("Please select exactly one item to update.");
                    return;
                }

                // Get the selected item's binding context
                var selectedContext = selectedItems[0].getBindingContext("claimModel");

                if (!selectedContext) {
                    MessageBox.error("No data to update.");
                    return;
                }

                // Get the data of the selected item from the model
                var selectedData = selectedContext.getProperty();

                // Assuming you have form fields that represent the properties you want to update
                var updatedData = {
                    category: this.byId("consultancycategorys").getSelectedKey(),
                    doctor: this.byId("DN").getValue(),
                    patientId: this.byId("ID").getValue(),
                    hospitalStore: this.byId("HospitalStore").getSelectedKey(),
                    hospitalLocation: this.byId("Hospitallocation").getSelectedKey(),
                    hospitalLocationOther: this.byId("HL").getValue(),
                    billDate: this.byId("billdate").getDateValue(),
                    billNo: this.byId("billno").getValue(),
                    billAmount: this.byId("billamount").getValue(),
                    discount: this.byId("discount").getValue(),
                    requestedAmount: this.byId("requestamount").getValue(),
                    review: this.byId("description").getValue()

                };

                // Update the existing item with the new data
                Object.assign(selectedData, updatedData);

                // Example: Update the existing item in the model
                var detailsModel = this.getView().getModel("claimModel");
                var allDetails = detailsModel.getProperty("/allDetails");
                var selectedIndex = selectedContext.getPath().split("/").pop();
                allDetails[selectedIndex] = selectedData;
                detailsModel.setProperty("/allDetails", allDetails);

                // Enable form fields after updating
                this.enableFormFields(true);

                // Show the Add, Delete, Edit, Clone buttons, hide the Update and Cancel buttons
                this.toggleButtonsVisibility(true, false, false, true, true);

                // Refresh the list binding to reflect the updated data
                this.byId("detailsList").getBinding("items").refresh();

                MessageBox.success("Data updated successfully.");
                this.clearForm();
                this.byId("detailsList").removeSelections();

                this.updateTotalRequestedAmount();
            },

            CancelPress: function () {
                // Disable form fields after canceling
                this.setFormValues(false);

                // Clear the selection in the list
                this.byId("detailsList").removeSelections();

                // Show the Add, Delete, Edit, Clone buttons, hide the Update and Cancel buttons
                this.toggleButtonsVisibility(true, false, false, true, true);

                MessageBox.success("Editing canceled.");
            },

            enableFormFields: function (enable) {
                // Enable or disable form fields based on the 'enable' parameter
                var formFields = [
                    "consultancycategorys", "DN", "ID", "HospitalStore", "Hospitallocation",
                    "HL", "billdate", "billno", "billamount", "discount", "requestamount", "description"
                ];

                formFields.forEach(function (field) {
                    this.byId(field).setEnabled(enable);
                }.bind(this));
            },

            toggleButtonsVisibility: function (add, update, cancel, edit, clone) {
                // Toggle visibility of buttons
                this.byId("button").setVisible(add);
                this.byId("button2").setVisible(!update);
                this.byId("button3").setVisible(edit);
                this.byId("buttonUpdate").setVisible(update);
                this.byId("buttonCancel").setVisible(cancel);
                this.byId("button4").setVisible(clone);
            },

            // handleDiscountChange: function (oEvent) {
            //     var oDiscountInput = oEvent.getSource();
            //     var oBillAmountInput = this.byId("billamount");
            //     var oRequestedAmountInput = this.byId("requestamount");

            //     var sDiscount = oDiscountInput.getValue();
            //     var sBillAmount = oBillAmountInput.getValue();

            //     // Check if Bill Amount has a value
            //     if (sBillAmount) {
            //         var fBillAmount = parseFloat(sBillAmount);

            //         if (sDiscount || sDiscount === "0") {
            //             // If Discount has a value or is explicitly set to "0", calculate Requested Amount: Bill Amount - Discount
            //             var fDiscount = parseFloat(sDiscount);
            //             var fRequestedAmount = fBillAmount - fDiscount;
            //             // Set the calculated value to the Requested Amount field
            //             oRequestedAmountInput.setValue(fRequestedAmount);
            //         } else {
            //             // If Discount is empty, set Requested Amount to Bill Amount
            //             oRequestedAmountInput.setValue(fBillAmount);
            //         }
            //     } else {
            //         // Clear the Requested Amount field if Bill Amount is empty
            //         oRequestedAmountInput.setValue("");
            //     }
            // },

            handleDiscountChange: function (oEvent) {
                var oDiscountInput = oEvent.getSource();
                var oBillAmountInput = this.byId("billamount");
                var oRequestedAmountInput = this.byId("requestamount");

                var sDiscount = oDiscountInput.getValue();
                var sBillAmount = oBillAmountInput.getValue();

                // Check if Bill Amount has a value
                if (sBillAmount) {
                    var fBillAmount = parseFloat(sBillAmount);

                    if (sDiscount || sDiscount === "0") {
                        // If Discount has a value or is explicitly set to "0", calculate Requested Amount: Bill Amount - Discount
                        var fDiscount = parseFloat(sDiscount);
                        var fRequestedAmount = fBillAmount - fDiscount;
                        // Set the calculated value to the Requested Amount field
                        oRequestedAmountInput.setValue(fRequestedAmount);
                    } else {
                        // If Discount is empty, set Requested Amount to 0
                        oRequestedAmountInput.setValue(0);
                    }
                } else {
                    // Clear the Requested Amount field if Bill Amount is empty
                    oRequestedAmountInput.setValue("");
                }
            },

            handleBillAmountChange: function (oEvent) {
                var oBillAmountInput = oEvent.getSource();
                var oDiscountInput = this.byId("discount");
                var oRequestedAmountInput = this.byId("requestamount");

                var sBillAmount = oBillAmountInput.getValue();
                var sDiscount = oDiscountInput.getValue();

                if (sBillAmount) {
                    var fBillAmount = parseFloat(sBillAmount);

                    if (sDiscount || sDiscount === "0") {
                        var fDiscount = parseFloat(sDiscount);
                        var fRequestedAmount = fBillAmount - fDiscount;
                        oRequestedAmountInput.setValue(fRequestedAmount);
                    } else {
                        // If Discount is empty, set Requested Amount to Bill Amount
                        oRequestedAmountInput.setValue(fBillAmount);
                    }
                } else {
                    // Clear the Requested Amount field if Bill Amount is empty
                    oRequestedAmountInput.setValue("");
                }
            },
            onBillDateChange: function () {
                var oBillDatePicker = this.byId("billdate");
                var oStartDatePicker = this.byId("startDatePicker1");
                var oEndDatePicker = this.byId("endDatePicker1");

                var oBillDate = oBillDatePicker.getDateValue();
                var oStartDate = oStartDatePicker.getDateValue();
                var oEndDate = oEndDatePicker.getDateValue();

                // Check if Bill Date is between Claim Start Date and Claim End Date
                if (oStartDate && oEndDate && oBillDate) {
                    if (oBillDate < oStartDate || oBillDate > oEndDate) {
                        // Show error message
                        MessageBox.error("Please select Bill Date between Claim Start Date and Claim End Date");
                        // You can also set the value of the Bill Date to null or handle it as needed
                        oBillDatePicker.setDateValue(null);
                    }
                }
            },

            handleEndDateChange: function (oEvent) {
                var oEndDatePicker = oEvent.getSource();
                var oStartDatePicker = this.byId("startDatePicker1");
                var oEndDate = oEndDatePicker.getDateValue();
                var oStartDate = oStartDatePicker.getDateValue();

                if (oEndDate && oStartDate) {
                    if (oEndDate < oStartDate) {
                        // End date is before start date, show error message
                        oEndDatePicker.setValueState("Error");
                        oEndDatePicker.setValueStateText("End date should be greater than start date");
                    } else {
                        // Clear any previous error state
                        oEndDatePicker.setValueState("None");
                    }
                }
            },
            updateTotalRequestedAmount: function () {
                var totalRequestedAmount = 0;
                var items = this.byId("detailsList").getItems();
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    var requestedAmount = parseInt(item.getBindingContext("claimModel").getProperty("requestedAmount"));
                    totalRequestedAmount += requestedAmount;
                }

                // Update the text of the label with the total requested amount
                this.byId("totalRequestedAmountLabel").setText("Total Requested Amount: " + totalRequestedAmount);
                // this.byId("totalRequestedAmount").setText("Total Requested Amount: " + totalRequestedAmount);
                this.byId("totalRequestedAmountValue").setText(totalRequestedAmount);
            },

            validateOnlyCharacters: function (oEvent) {
                var input = oEvent.getSource();
                var value = input.getValue().trim();
                var pattern = /^[A-Za-z\s]*$/; // Regular expression to match only characters and whitespace
                var isValid = pattern.test(value);
                input.setValueState(isValid ? "None" : "Error");
                input.setValueStateText(isValid ? "" : "Only characters are allowed");
            },

            validateOnlyNumbers: function (oEvent) {
                var input = oEvent.getSource();
                var value = input.getValue().trim();
                var pattern = /^[0-9]+$/; // Regular expression to match only numbers
                var isValid = pattern.test(value);
                input.setValueState(isValid ? "None" : "Error");
                input.setValueStateText(isValid ? "" : "Only numbers are allowed");
            },

            onHospitalLocationChange: function (oEvent) {
                var selectedKey = oEvent.getSource().getSelectedKey();

                if (selectedKey === "OTHER") {
                    sap.m.MessageBox.information("Please enter Hospital Location (If Other)");
                }
            },

            onTreatmentChange: function (oEvent) {
                var selectedKey = oEvent.getSource().getSelectedKey();

                if (selectedKey === "OTHER") {
                    sap.m.MessageBox.information(" Please enter Treatment For (If Other)");
                }
            },


            handleSubmit: function () {
                var that = this;
                var AD = this.getView().getModel("claimModel").getData();
                let allDetails = AD.allDetails;

                // Iterate over each detail item and send the claim individually
                allDetails.forEach(function (detail) {
                    // Construct claim object for each detail
                    var claimid = parseInt(new Date().getTime() / 1000);
                    var person = 90000;
                    var claimType = that.byId("claimt").getText();
                    var claimStartDate = new Date(that.byId("claimsd").getText()).toISOString();
                    var claimEndDate = new Date(that.byId("claimed").getText()).toISOString();
                    var treatmentFor = that.byId("claimtf").getText();
                    var treatmentForOther = that.byId("claimtfo").getText();
                    var selectedDependent = that.byId("claimsde").getText();
                    // var requestamount = parseFloat(that.byId("requestamount").getText());
                    var requestamount = parseFloat(detail.requestedAmount);
                    var consultancyCategory = detail.category;
                    var hospitalStore = detail.hospitalStore;
                    var billDate = detail.billDate.toISOString();
                    var billNo = detail.billNo;
                    var billAmount = parseFloat(detail.billAmount);
                    var discount = parseFloat(detail.discount);


                    // Create a new claim object for each detail
                    var newClaim = {
                        CLAIM_ID: claimid,
                        PERSON_NUMBER: person,
                        CLAIM_TYPE: claimType,
                        CLAIM_START_DATE: claimStartDate,
                        CLAIM_END_DATE: claimEndDate,
                        TREATMENT_FOR: treatmentFor,
                        TREATMENT_FOR_IF_OTHERS: treatmentForOther,
                        SELECT_DEPENDENTS: selectedDependent,
                        REQUESTED_AMOUNT: requestamount,
                        CONSULTANCY_CATEGORY: consultancyCategory,
                        MEDICAL_STORE: hospitalStore,
                        BILL_DATE: billDate,
                        BILL_NO: billNo,
                        BILL_AMOUNT: billAmount,
                        DISCOUNT: discount

                    };

                    // Send the claim data to the server using Fetch API
                    fetch("/odata/v4/my/CLAIM_DETAILS", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(newClaim), // Send the individual claim
                    })
                        .then(result => {
                            sap.m.MessageBox.success(
                                "Claim data saved successfully!",
                                {
                                    onClose: function () {
                                        // Navigate to "Login" after the success message is closed
                                        var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
                                        oRouter.navTo("Login");
                                        window.location.reload();
                                    },
                                }
                            );
                        })
                        .catch(error => {
                            sap.m.MessageBox.error("Error while saving claim data");
                        });
                });
            },
            //UPLOAD START FROM HERE//

            onBeforeInitiatingItemUpload: function (oEvent) {
                // Event triggered before initiating each upload.
            },
            // UploadCompleted event handler
            onUploadCompleted: function (oEvent) {
                var oModel = this.getView().getModel();
                var iResponseStatus = oEvent.getParameter("status");

                // check for upload is sucess
                if (iResponseStatus === 201) {
                    oModel.refresh(true);
                    setTimeout(function () {
                        MessageToast.show("Document Added");
                    }, 1000);
                }
                // This code block is only for demonstration purpose to simulate XHR requests, hence restoring the server to not fake the xhr requests.
                // this.oMockServer.restore();
            },

            getFileCategories: function () {
                return [
                    { categoryId: "Invoice", categoryText: "Invoice" },
                    { categoryId: "Specification", categoryText: "Specification" },
                    { categoryId: "Attachment", categoryText: "Attachment" },
                    { categoryId: "Legal Document", categoryText: "Legal Document" }
                ];
            },
            openFileUploadDialog: function () {
                var items = this.oItemsProcessor;

                if (items && items.length) {

                    this._oFilesTobeuploaded = items;

                    var oItemsMap = this._oFilesTobeuploaded.map(function (oItemProcessor) {

                        return {
                            fileName: oItemProcessor.item.getFileName(),
                            fileCategorySelected: this.documentTypes[0].categoryId,
                            itemInstance: oItemProcessor.item,
                            fnResolve: oItemProcessor.resolve,
                            fnReject: oItemProcessor.reject
                        };
                    }.bind(this));
                    var oModel = new JSONModel({
                        "selectedItems": oItemsMap,
                        "types": this.documentTypes

                    });
                    if (!this._fileUploadFragment) {
                        Fragment.load({
                            name: "sap.m.sample.UploadSetwithTable.UploadSetwithTableFileUploads.fragments.FileUpload",
                            id: this.getView().getId() + "-file-upload-dialog",
                            controller: this
                        })
                            .then(function (oPopover) {
                                this._fileUploadFragment = oPopover;
                                this.getView().addDependent(oPopover);
                                oPopover.setModel(oModel);
                                oPopover.open();
                            }.bind(this));
                    } else {
                        this._fileUploadFragment.setModel(oModel);
                        this._fileUploadFragment.open();
                    }
                }
            },
            closeFileUplaodFragment: function () {
                this._fileUploadFragment.destroy();
                this._fileUploadFragment = null;
                this._oFilesTobeuploaded = [];
                this.oItemsProcessor = [];
            },

            // onCustomerPress: function (oEvent) {
            //     var oButton = oEvent.getSource();
            //     var sClaimId = oButton.getBindingContext("MainModel").getProperty("CLAIM_ID");

            //     this.onOpenDialog(sClaimId);
            // },
            onCustomerPress: function (oEvent) {
                var oButton = oEvent.getSource();
                var sClaimId = oButton.getBindingContext("MainModel").getProperty("CLAIM_ID");

                // Store sClaimId as a property of the controller
                this._sClaimId = sClaimId;

                this.onOpenDialog(sClaimId);
            },


            onOpenDialog: function (sClaimId) {

                var oView = this.getView();
                var oDialog = oView.byId("manage");

                // Retrieve sClaimId from the controller's property
                var sClaimId = this._sClaimId;

                console.log("Claim ID:", sClaimId);


                if (!oDialog) {
                    // Load the fragment if not already loaded
                    oDialog = sap.ui.xmlfragment(oView.getId(), "hmel.claims.hmelclaim.fragments.manage", this);
                    oView.addDependent(oDialog);
                }

                // Set the title with claim ID
                oDialog.setTitle("Claim ID: " + sClaimId);

                oDialog.open();
            },


            onCloseFrag: function () {
                var oView = this.getView();
                var oDialog = oView.byId("manage");
                oDialog.close();
            },
            onSaveFrag: function () {
                const oView = this.getView();
                const oDialog = oView.byId("manage");
                const sClaimId = this._sClaimId;
                
                // Get all input values
                const sBatchNo = oView.byId("batchno").getValue();
                const sDocumentStatus = oView.byId("documentstatus").getValue();
                const sBankName = oView.byId("bankname").getValue();
                const sChequeNo = oView.byId("chequeno").getValue();
                const sHLRemarks = oView.byId("hlremarks").getValue();
            
                // Get the settlement date value as a timestamp (in milliseconds)
                const nSettlementTimestamp = Date.now();
                const sSettlementDateISO = new Date(nSettlementTimestamp).toISOString();
            
                // Get the NIA date as a timestamp (in milliseconds)
                const nNia = Date.now();
                const sNiaISO = new Date(nNia).toISOString();
            
                // Prepare payload for ZHRMEDICLAIM
                const oPayloadZHRMEDICLAIM = {
                    REFNR: sClaimId,
                    SETTLEMENT_DATE: sSettlementDateISO,
                    HR_REMARKS: sHLRemarks,
                    NIA_DATE: sNiaISO,
                    CHECK_NO: sChequeNo,
                    BATCH_NO: sBatchNo,
                    BANK_NAME: sBankName,
                    STATUS: sDocumentStatus
                };
            
                // Save data in ZHRMEDICLAIM
                this.saveDataToZHRMEDICLAIM(oPayloadZHRMEDICLAIM)
                    .then(() => {
                        // Clear form fields
                        oView.byId("batchno").setValue("");
                        oView.byId("documentstatus").setValue("");
                        oView.byId("bankname").setValue("");
                        oView.byId("chequeno").setValue("");
                        oView.byId("hlremarks").setValue("");
            
                        // Close dialog
                        oDialog.close();

                        location.reload();
            
                        // Navigate back to claim reports
                        this.getOwnerComponent().getRouter().navTo("detail2"); // Replace "claimReports" with the actual route name
                    })
                    .catch(() => {
                        // Handle error if needed
                    });
            },
            
            saveDataToZHRMEDICLAIM: function (oPayloadZHRMEDICLAIM) {
                return new Promise((resolve, reject) => {
                    $.ajax({
                        url: "/odata/v4/my/ZHRMEDICLAIM",
                        type: "POST",
                        contentType: "application/json",
                        data: JSON.stringify(oPayloadZHRMEDICLAIM),
                        success: function () {
                            sap.m.MessageBox.success("Data saved successfully in ZHRMEDICLAIM");
                            resolve();
                        },
                        error: function () {
                            sap.m.MessageBox.error("Failed to save data in ZHRMEDICLAIM");
                            reject();
                        }
                    });
                });
            }
            
            
        });
    });
