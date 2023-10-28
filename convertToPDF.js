const puppeteer = require('puppeteer');
const fs = require('fs');

async function convertHTMLtoPDF(htmlContent, outputPath) {
  const browser = await puppeteer.launch({
    headless: "new", // Use the new headless mode
  });
  const page = await browser.newPage();

 
  await page.setContent(htmlContent);

  const pdfBuffer = await page.pdf();

 
  fs.writeFileSync(outputPath, pdfBuffer);

 
  await browser.close();
}


const exampleHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.5.0/Chart.min.js"></script>
</head>
<body>
    <canvas id="overDueChart" style="max-width:650px;max-height:300px;background:transparent; margin: auto;"></canvas>
    <canvas id="receivedPaymentChart" style="max-width:650px;max-height:300px;background:transparent; margin: auto;"></canvas>

    <script>
        const apiUrl = 'https://karomanage-dev-apim.azure-api.net/notification-hub-fnp/monthlyReport?customerId=dd6336f0-f166-49b9-ab92-9a3f3e36443c&organizationId=YT-0028';
        const headers = {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': '181533bf043846b18b3227d84d92f235', 
        };

        fetch(apiUrl, { headers })
            .then(response => response.json())
            .then(data => {
                if (data.statusCode === 200) {
                    console.log(data.data.overDue, "overDueData");
                    displayOverDueGraph(data.data.overDue);
                    displayReceivedPaymentGraph(data.data.recieved);
                } else {
                    console.error('Failed to fetch data:', data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });

        function getDaysInMonth(month, year) {
            return new Date(year, month, 0).getDate();
        }

        function generateDaysArray() {
            const daysInMonth = getDaysInMonth(new Date().getMonth() + 1, new Date().getFullYear());
            return Array.from({ length: daysInMonth }, (_, i) => i + 1);
        }

        function displayOverDueGraph(overDueData) {
            const dailyData = overDueData.reduce((acc, payment) => {
                if (payment.paymentForecast && Array.isArray(payment.paymentForecast)) {
                    payment.paymentForecast.forEach(paymentDetails => {
                        if (paymentDetails.Details) {
                            const dateParts = paymentDetails.Details.nextpaymetDate.split("-");
                            const day = parseInt(dateParts[0], 10);
                            acc[day] = (acc[day] || 0) + paymentDetails.Details.duePayment;
                        }
                    });
                }
                return acc;
            }, {});

            const xValues = generateDaysArray();
            const yValues = xValues.map(day => dailyData[day] || 0);

            var barColors = "red";

            new Chart("overDueChart", {
                type: "bar",
                data: {
                    labels: xValues,
                    datasets: [{
                        backgroundColor: barColors,
                        data: yValues,
                    }],
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: "Total due payments for current month",
                        },
                    },
                    legend: { display: false },
                    scales: {
                        x: {
                            grid: {
                                display: false,
                            },
                        },
                        y: {
                            grid: {
                                display: false,
                            },
                        },
                    },
                    tooltips: {
                        enabled: false,
                    },
                },
            });
        }

        function displayReceivedPaymentGraph(receivedData) {
            const dailyData = receivedData.reduce((acc, payment) => {
                const dateParts = payment.paymetReceiveDate.split("-");
                const day = parseInt(dateParts[0], 10);
                acc[day] = (acc[day] || 0) + payment.receivedPayment;
                return acc;
            }, {});

            const xValues = generateDaysArray();
            const yValues = xValues.map(day => dailyData[day] || 0);

            var barColors = "rgb(166, 206, 166)";

            new Chart("receivedPaymentChart", {
                type: "bar",
                data: {
                    labels: xValues,
                    datasets: [{
                        backgroundColor: barColors,
                        data: yValues,
                    }],
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: "Total received payments for current month",
                        },
                    },
                    legend: { display: false },
                    scales: {
                        x: {
                            grid: {
                                display: false,
                            },
                        },
                        y: {
                            grid: {
                                display: false,
                            },
                        },
                    },
                    tooltips: {
                        enabled: false,
                    },
                },
            });
        }
    </script>
</body>
</html>


`;

const outputPath = 'output.pdf';


convertHTMLtoPDF(exampleHTML, outputPath)
  .then(() => {
    console.log(`PDF saved to ${outputPath}`);
  })
  .catch((error) => {
    console.error('Error converting HTML to PDF:', error);
  });
