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
    // srv.on('policydetails', async (req) => {
    //     const { PolicyNumber, startDatePicker1 } = req.data;



    //     try {
    //         // Fetch the category from the database
    //         const PolicyStartDate = await cds.run(SELECT.one('POLICY_STARTDATE').
    //             from('MYSERVICE_POLICY_DETAILS').
    //             where({ POLICYNO: PolicyNumber }));
    //         // const DOC = new Date();
    //         // DOC.setMonth(DOC.getMonth()-2);
    //         const MonthOfP_Date = PolicyStartDate.getmonth();
    //         const MonnthOfC_Date = startDatePicker1.getmonth();
    //         var MonthDiff = (MonthOfP_Date) - (MonnthOfC_Date);
    //         if (MonthDiff == 2) {
    //             return 'Set';
    //         }
    //         else {
    //             return 'Fail'
    //         }
    //     }
    //     catch (error) {
    //         console.error('Error occurred during database query:', error);
    //         // Return the error response
    //         return {
    //             success: false,
    //             message: "An error occurred during database query. Please try again later."
    //         };
    //     }
    // });
    srv.on('policydetails', async (req) => {
        const { PolicyNumber, ClaimDetails } = req.data;

        try {
            // Fetch the policy start date from the database
            const policyStartDate = await cds
                .select('POLICY_STARTDATE')
                .from('MYSERVICE_POLICY_DETAILS')
                .where({ POLICYNO: PolicyNumber });

            const policyStartDateValue = policyStartDate[0].POLICY_STARTDATE;

            // Process claim details and policy start date as needed
            // For simplicity, let's just log the details for now
            console.log('Policy Start Date:', policyStartDateValue);
            console.log('Claim Details:', ClaimDetails);

            // Your business logic here, e.g., checking claim validity based on policy start date

            const claimdate = req.ClaimDetails;
            if ((claimdate - policyStartDateValue) === 2) {


                // Return a response to the client
                return {
                    success: true,
                    message: 'Claim details processed successfully.',
                };
            }
        } catch (error) {
            console.error('Error occurred during database query:', error);

            // Return an error response
            return {
                success: false,
                message: 'An error occurred during database query. Please try again later.',
            };
        }
    });


});



