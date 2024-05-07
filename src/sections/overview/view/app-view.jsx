import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import AppCurrentVisits from '../app-current-visits';
import AppWebsiteVisits from '../app-website-visits';
import AppWidgetSummary from '../app-widget-summary';

export default function AppView() {
  return (
    <Container maxWidth="xl">
      <Typography variant="h6" sx={{ mb: 5 }}>
        Hi, Lucy Mwale <br />Welcome back 👋
      </Typography>

      <Grid container spacing={3}>
        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Limulunga District"
            total={1}
            color="success"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#DC143C" className="w-6 h-6">
                <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
              </svg>
            }
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Households Assessed"
            total={475}
            color="info"
            icon={<img alt="icon" src="/assets/icons/glass/ic_glass_users.png" />}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="VCAs Assessed"
            total={768}
            color="warning"
            icon={<img alt="icon" src="/assets/icons/glass/ic_glass_users.png" />}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Household Members Assessed"
            total={234}
            color="error"
            icon={<img alt="icon" src="/assets/icons/glass/ic_glass_users.png" />}
          />
        </Grid>

        <Grid xs={12} md={6} lg={8}>
          <AppWebsiteVisits
            title="Households, VCAs and Household Members assessed into months"
            subheader="(+23%) than last year"
            chart={{
              labels: [
                '10/01/2023',
                '11/01/2023',
                '12/01/2023',
                '01/01/2024',
                '02/01/2024',
                '03/01/2024',
                '04/01/2024',
                '05/01/2024',
              ],
              series: [
                {
                  name: 'Households Assessed',
                  type: 'area',
                  fill: 'gradient',
                  data: [30, 25, 36, 30, 45, 35, 64, 52],
                },
                {
                  name: 'VCAs Assessed',
                  type: 'area',
                  fill: 'gradient',
                  data: [43, 27, 56, 41, 21, 43, 22, 67],
                },
                {
                  name: 'Household Members Assessed',
                  type: 'area',
                  fill: 'gradient',
                  data: [39, 36, 59, 52, 64, 35, 45, 30],
                },
              ],
            }}
            // style={{ height: 550 }}
          />
        </Grid>

        <Grid xs={12} md={6} lg={4}>
          <AppCurrentVisits
            title="VCAs Severity Chart"
            chart={{
              series: [
                { label: 'High Risk', value: 4344 },
                { label: 'Medium Risk', value: 5435 },
                { label: 'Low Risk', value: 1443 },
              ],
            }}
          />
        </Grid>
      </Grid>
    </Container>
  );
}
