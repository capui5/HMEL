const cds = require('@sap/cds');

module.exports = cds.service.impl(srv => {
    srv.on('validations', async (req) => {
        const { startDate, endDate, requestedAmount, category } = req.data;

        console.log(category);

        try {
            // Fetch the category from the database
            //const categoryData = await cds.run(SELECT.one('CONSULTANCY_CATEGORY').from('MYSERVICE_CONSULTANCY_CAP_LIMIT').where({ CONSULTANCY_CATEGORY: category }));
            const capAmountData = await cds.run(SELECT.one('CAP_AMOUNT').
                from('MYSERVICE_CONSULTANCY_CAP_LIMIT').
                where({ CONSULTANCY_CATEGORY: category }));


            // Extract the CAP_AMOUNT value
            const capAmount = capAmountData.CAP_AMOUNT;

            // Compare requested amount with CAP_AMOUNT
            const finalAmount = Math.min(requestedAmount, capAmount);

            return {
                success: true,
                finalAmount: finalAmount,
                eligibleAmount: capAmount
            };
        } catch (error) {
            console.error('Error occurred during database query:', error);
            // Return the error response
            return {
                success: false,
                message: "An error occurred during database query. Please try again later."
            };
        }
    });
//VALIDATION FOR POLICY DETAILS//

    srv.on('policyValidations', async (req) => {
        console.log(req.data)
        const { policyNumber, startDate, illnessName } = req.data;


        // Function to fetch policy start date from the database
        async function fetchPolicyStartDate(policyNumber) {
            const policyData = await cds.run(
                SELECT.one
                    .from('MYSERVICE_POLICY_DETAILS')
                    .where({ POLICYNO: policyNumber })

            );
            console.log(policyData)
            // return new Date(policyData.POLICY_STARTDATE); 
            return policyData
        }

        try {
            // Fetch the policy start date from the database
            const policyData = await fetchPolicyStartDate(policyNumber);

            if (policyData.ILLNESS_NAME === illnessName && policyData.PRE_ILLNESS === 1) {

                // Calculate difference in months between policy start date and provided start date

                const diffInMonths = calculateMonthDifference(new Date(policyData.POLICY_STARTDATE), new Date(startDate));

                // Check if the difference is greater than or equal to 2 months
                if (diffInMonths >= 2) {
                    // Return success response if the difference is greater than or equal to 2 months
                    return { success: true };
                } else {
                    // Return error response if the difference is less than 2 months
                    return { success: false, message: 'you have a cooling-off period of 2 months\n from the date of policy issuance' };
                }

            }
            else {
                return { success: true }
            }
        } catch (error) {
            // Log error
            console.error('Error occurred during policy validation:', error);
            // Return an error response
            return { success: false, message: 'An error occurred during policy validation. Please try again later.' };
        }
    });
    // Function to calculate difference in months between two dates
    function calculateMonthDifference(date1, date2) {
        return (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth());
    }

//Validation for STATUS UPDATE//
    // srv.on('statusUpdate', async (req) => {
    //     console.log(req.data);
    //     const { REFNR, Status } = req.data;
    
    //     try {
    //         async function updateClaimStatus(REFNR, Status) {
    //             await cds.run(UPDATE('MYSERVICE_ZHRMEDICLAIM').set({ STATUS: Status }).where({ REFNR: REFNR }));
    //         }
    
    //         await updateClaimStatus(REFNR, Status);
    
    //         return { success: true, message: 'Claim status updated successfully' };
    //     } catch (error) {
    //         console.error('Error occurred during status update:', error);
    //         return { success: false, message: 'An error occurred during status update. Please try again later.' };
    //     }
    // });
    srv.on('statusUpdate', async (req) => {
        console.log(req.data);
        const { REFNR, Status } = req.data;
   
        try {
            await cds.run(UPSERT.into('MYSERVICE_ZHRMEDICLAIM')
                .entries([{ REFNR, STATUS: Status }]));
   
            return { success: true, message: 'Claim status updated successfully' };
        } catch (error) {
            console.error('Error occurred during status update:', error);
            return { success: false, message: 'An error occurred during status update. Please try again later.' };
        }
    });

});



