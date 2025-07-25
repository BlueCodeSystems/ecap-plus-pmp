import { CategoryType } from '../categoriesList';

export interface Component {
  name: string;
  title: string;
  url: string;
  categories: CategoryType[];
  keywords: string[];
}

// TODO review and come up with a better approach for urls
// maybe we need to have enum with all routes like we had before?

// TODO change urls according to new dashboard routes and add new NFT components
export const components: Component[] = [
  {
    name: 'Protein',
    title: 'medical-dashboard.protein',
    url: `/medical-dashboard/#protein`,
    categories: ['charts'],
    keywords: ['protein', 'charts', 'statistics'],
  },
  {
    name: 'Fat',
    title: 'medical-dashboard.fat',
    url: `/medical-dashboard/#fat`,
    categories: ['charts'],
    keywords: ['fat', 'charts', 'statistics'],
  },
  {
    name: 'Bones',
    title: 'medical-dashboard.bones',
    url: `/medical-dashboard/#bones`,
    categories: ['charts'],
    keywords: ['bones', 'charts', 'statistics'],
  },
  {
    name: 'Water',
    title: 'medical-dashboard.water',
    url: `/medical-dashboard/#water`,
    categories: ['charts'],
    keywords: ['water', 'statistics', 'charts'],
  },
  {
    name: 'Map',
    title: 'common.map',
    url: `/medical-dashboard/#map`,
    categories: ['maps'],
    keywords: ['maps', 'doctor', 'polyclinic'],
  },
  {
    name: 'Blood screening',
    title: 'medical-dashboard.bloodScreening.title',
    url: `/medical-dashboard/#blood-screening`,
    categories: ['data tables', 'charts'],
    keywords: ['blood screening', 'statistics', 'data tables', 'charts'],
  },
  {
    name: 'Latest screenings',
    title: 'medical-dashboard.latestScreenings.title',
    url: `/medical-dashboard/#latest-screenings`,
    categories: ['charts'],
    keywords: ['latest screenings', 'charts', 'statistics'],
  },
  {
    name: 'Treatment plan',
    title: 'medical-dashboard.treatmentPlan.title',
    url: `/medical-dashboard/#treatment-plan`,
    categories: ['data tables'],
    keywords: ['treatment plan', 'data tables', 'doctor'],
  },
  {
    name: 'Activity',
    title: 'medical-dashboard.activity.title',
    url: `/medical-dashboard/#activity`,
    categories: ['charts'],
    keywords: ['activity', 'charts', 'statistics'],
  },
  {
    name: 'Covid',
    title: 'medical-dashboard.covid.title',
    url: `/medical-dashboard/#covid`,
    categories: ['charts'],
    keywords: ['covid', 'charts', 'statistics'],
  },
  {
    name: 'Patient timeline',
    title: 'medical-dashboard.patientResults.title',
    url: `/medical-dashboard/#patient-timeline`,
    categories: ['data tables'],
    keywords: ['patient timeline', 'data tables'],
  },
  {
    name: 'Health',
    title: 'medical-dashboard.health.title',
    url: `/medical-dashboard/#health`,
    categories: ['charts'],
    keywords: ['health', 'charts'],
  },
  {
    name: 'Favorite doctors',
    title: 'medical-dashboard.favoriteDoctors.title',
    url: `/medical-dashboard/#favorite-doctors`,
    categories: ['data tables'],
    keywords: ['favorite doctors', 'data tables'],
  },
  {
    name: 'News',
    title: 'medical-dashboard.news',
    url: `/medical-dashboard/#news`,
    categories: ['data tables'],
    keywords: ['news', 'data tables'],
  },
  {
    name: 'Feed',
    title: 'common.feed',
    url: `typescript
    import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
    import {
      ResetPasswordRequest,
      login,
      LoginRequest,
      signUp,
      SignUpRequest,
      resetPassword,
      verifySecurityCode,
      SecurityCodePayload,
      NewPasswordData,
      setNewPassword,
    } from '@app/api/auth.api';
    import { setUser } from '@app/store/slices/userSlice';
    import { deleteToken, deleteUser, persistToken, readToken, persistUser } from '@app/services/localStorage.service';
    
    export interface AuthSlice {
      token: string | null;
    }
    
    const initialState: AuthSlice = {
      token: readToken(),
    };
    
    export const doLogin = createAsyncThunk('auth/doLogin', async (loginPayload: LoginRequest, { dispatch }) => {
      const res = await login(loginPayload);
      dispatch(setUser(res.user));
      persistToken(res.access_token); // Ensure this is a string
      persistUser(res.user);
      return res.access_token; // Ensure this is a string
    });
    
    export const doSignUp = createAsyncThunk('auth/doSignUp', async (signUpPayload: SignUpRequest) =>
      signUp(signUpPayload),
    );
    
    export const doResetPassword = createAsyncThunk(
      'auth/doResetPassword',
      async (resetPassPayload: ResetPasswordRequest) => resetPassword(resetPassPayload),
    );
    
    export const doVerifySecurityCode = createAsyncThunk(
      'auth/doVerifySecurityCode',
      async (securityCodePayload: SecurityCodePayload) => verifySecurityCode(securityCodePayload),
    );
    
    export const doSetNewPassword = createAsyncThunk('auth/doSetNewPassword', async (newPasswordData: NewPasswordData) =>
      setNewPassword(newPasswordData),
    );
    
    export const doLogout = createAsyncThunk('auth/doLogout', (_payload_, { dispatch }) => {
      deleteToken();
      deleteUser();
      dispatch(setUser(null));
    });
    
    const authSlice = createSlice({
      name: 'auth',
      initialState,
      reducers: {},
      extraReducers: (builder) => {
        builder.addCase(doLogin.fulfilled, (state, action) => {
          state.token = action.payload; // Ensure this is a string
        });
      },
    });
    
    export default authSlice.reducer;
    `,
    categories: ['apps'],
    keywords: ['feed', 'apps'],
  },
  {
    name: 'Log in',
    title: 'common.login',
    url: `/auth/login`,
    categories: ['auth'],
    keywords: ['auth', 'log in', 'login'],
  },
  {
    name: 'Sign up',
    title: 'common.signup',
    url: `/auth/sign-up`,
    categories: ['auth'],
    keywords: ['auth', 'sign up', 'signup'],
  },
  {
    name: 'Lock',
    title: 'common.lock',
    url: `/auth/lock`,
    categories: ['auth'],
    keywords: ['auth', 'lock'],
  },
  {
    name: 'Forgot password',
    title: 'common.forgotPass',
    url: `/auth/forgot-password`,
    categories: ['auth'],
    keywords: ['auth', 'forgot password'],
  },
  {
    name: 'Security code',
    title: 'common.securityCode',
    url: `/auth/security-code`,
    categories: ['auth'],
    keywords: ['auth', 'security code'],
  },
  {
    name: 'New password',
    title: 'common.newPassword',
    url: `/auth/new-password`,
    categories: ['auth'],
    keywords: ['auth', 'new password'],
  },
  {
    name: 'Dynamic form',
    title: 'forms.dynamicForm',
    url: `/forms/advanced-forms/#dynamic-form`,
    categories: ['forms'],
    keywords: ['dynamic form', 'forms'],
  },
  {
    name: 'Control form',
    title: 'forms.controlForm',
    url: `/forms/advanced-forms/#control-form`,
    categories: ['forms'],
    keywords: ['control form', 'forms'],
  },
  {
    name: 'Validation form',
    title: 'forms.validationForm',
    url: `/forms/advanced-forms/#validation-form`,
    categories: ['forms'],
    keywords: ['validation form', 'forms'],
  },
  {
    name: 'Step form',
    title: 'forms.stepForm',
    url: `/forms/advanced-forms/#step-form`,
    categories: ['forms'],
    keywords: ['step form', 'forms'],
  },
  {
    name: 'Basic table',
    title: 'tables.basicTable',
    url: `/data-tables/#basic-table`,
    categories: ['data tables'],
    keywords: ['basic table', 'data tables'],
  },
  {
    name: 'Tree table',
    title: 'tables.treeTable',
    url: `/data-tables/#tree-table`,
    categories: ['data tables'],
    keywords: ['tree table', 'data tables'],
  },
  {
    name: 'Editable table',
    title: 'tables.editableTable',
    url: `/data-tables/#editable-table`,
    categories: ['data tables'],
    keywords: ['editable table', 'data tables'],
  },
  {
    name: 'Gradient stacked area',
    title: 'charts.gradientLabel',
    url: `/charts/#gradient-stacked-area`,
    categories: ['charts'],
    keywords: ['gradient stacked area', 'charts'],
  },
  {
    name: 'Bar animation delay',
    title: 'charts.barLabel',
    url: `/charts/#bar-animation-delay`,
    categories: ['charts'],
    keywords: ['gradient stacked area', 'charts'],
  },
  {
    name: 'Pie',
    title: 'charts.pie',
    url: `/charts/#pie`,
    categories: ['charts'],
    keywords: ['pie', 'charts'],
  },
  {
    name: 'Scatter',
    title: 'charts.scatter',
    url: `/charts/#scatter`,
    categories: ['charts'],
    keywords: ['scatter', 'charts'],
  },
  {
    name: 'Line race',
    title: 'charts.lineRace',
    url: `/charts/#line-race`,
    categories: ['charts'],
    keywords: ['line race', 'charts'],
  },
  {
    name: 'Server error',
    title: 'common.serverError',
    url: `/server-error`,
    categories: ['data tables'],
    keywords: ['server error', 'data tables', '500'],
  },
  {
    name: 'Client error',
    title: 'common.clientError',
    url: `/404`,
    categories: ['data tables'],
    keywords: ['client error', 'data tables', '400'],
  },
  {
    name: 'Personal info',
    title: 'profile.nav.personalInfo.title',
    url: `/profile/personal-info`,
    categories: ['data tables'],
    keywords: ['personal info', 'data tables'],
  },
  {
    name: 'Security settings',
    title: 'profile.nav.securitySettings.title',
    url: `/profile/security-settings`,
    categories: ['data tables'],
    keywords: ['security settings', 'data tables'],
  },
  {
    name: 'Notifications (settings)', // Have to explain bcz user can understand it like a page with a list of his notifications
    title: 'profile.nav.notifications.settings',
    url: `/profile/notifications`,
    categories: ['data tables'],
    keywords: ['notifications', 'data tables'],
  },
  {
    name: 'Payments',
    title: 'profile.nav.payments.title',
    url: `/profile/payments`,
    categories: ['data tables'],
    keywords: ['payments', 'data tables'],
  },
  {
    name: 'Alert',
    title: 'common.alert',
    url: `/ui-components/alert`,
    categories: ['data tables'],
    keywords: ['alert', 'data tables'],
  },
  {
    name: 'Avatar',
    title: 'common.avatar',
    url: `/ui-components/avatar`,
    categories: ['data tables'],
    keywords: ['avatar', 'data tables'],
  },
  {
    name: 'AutoComplete',
    title: 'common.autocomplete',
    url: `/ui-components/auto-complete`,
    categories: ['data tables'],
    keywords: ['autocomplete', 'data tables'],
  },
  {
    name: 'Badge',
    title: 'common.badge',
    url: `/ui-components/badge`,
    categories: ['data tables'],
    keywords: ['badge', 'data tables'],
  },
  {
    name: 'Breadcrumbs',
    title: 'common.breadcrumbs',
    url: `/ui-components/breadcrumbs`,
    categories: ['data tables'],
    keywords: ['breadcrumbs', 'data tables'],
  },
  {
    name: 'Button',
    title: 'common.button',
    url: `/ui-components/button`,
    categories: ['data tables'],
    keywords: ['button', 'data tables'],
  },
  {
    name: 'Checkbox',
    title: 'common.checkbox',
    url: `/ui-components/checkbox`,
    categories: ['data tables'],
    keywords: ['checkbox', 'data tables'],
  },
  {
    name: 'Collapse',
    title: 'common.collapse',
    url: `/ui-components/collapse`,
    categories: ['data tables'],
    keywords: ['collapse', 'data tables'],
  },
  {
    name: 'DateTime Picker',
    title: 'common.dateTimePicker',
    url: `/ui-components/date-time-picker`,
    categories: ['data tables'],
    keywords: ['date', 'time', 'picker', 'data tables'],
  },
  {
    name: 'Dropdown',
    title: 'common.dropdown',
    url: `/ui-components/dropdown`,
    categories: ['data tables'],
    keywords: ['dropdown', 'data tables'],
  },
  {
    name: 'Input',
    title: 'common.input',
    url: `/ui-components/input`,
    categories: ['data tables'],
    keywords: ['input', 'data tables'],
  },
  {
    name: 'Modal',
    title: 'common.modal',
    url: `/ui-components/modal`,
    categories: ['data tables'],
    keywords: ['modal', 'data tables'],
  },
  {
    name: 'Notification',
    title: 'common.notification',
    url: `/ui-components/notification`,
    categories: ['data tables'],
    keywords: ['notification', 'data tables'],
  },
  {
    name: 'Pagination',
    title: 'common.pagination',
    url: `/ui-components/pagination`,
    categories: ['data tables'],
    keywords: ['pagination', 'data tables'],
  },
  {
    name: 'Popconfirm',
    title: 'common.popconfirm',
    url: `/ui-components/popconfirm`,
    categories: ['data tables'],
    keywords: ['popconfirm', 'data tables'],
  },
  {
    name: 'Popover',
    title: 'common.popover',
    url: `/ui-components/popover`,
    categories: ['data tables'],
    keywords: ['popover', 'data tables'],
  },
  {
    name: 'Progress',
    title: 'common.progress',
    url: `/ui-components/progress`,
    categories: ['data tables'],
    keywords: ['progress', 'data tables'],
  },
  {
    name: 'Radio',
    title: 'common.radio',
    url: `/ui-components/radio`,
    categories: ['data tables'],
    keywords: ['radio', 'data tables'],
  },
  {
    name: 'Rate',
    title: 'common.rate',
    url: `/ui-components/rate`,
    categories: ['data tables'],
    keywords: ['rate', 'data tables'],
  },
  {
    name: 'Result',
    title: 'common.result',
    url: `/ui-components/result`,
    categories: ['data tables'],
    keywords: ['result', 'data tables'],
  },
  {
    name: 'Select',
    title: 'common.select',
    url: `/ui-components/select`,
    categories: ['data tables'],
    keywords: ['select', 'data tables'],
  },
  {
    name: 'Skeleton',
    title: 'common.skeleton',
    url: `/ui-components/skeleton`,
    categories: ['data tables'],
    keywords: ['skeleton', 'data tables'],
  },
  {
    name: 'Spinner',
    title: 'common.spinner',
    url: `/ui-components/spinner`,
    categories: ['data tables'],
    keywords: ['spinner', 'data tables'],
  },
  {
    name: 'Steps',
    title: 'common.steps',
    url: `/ui-components/steps`,
    categories: ['data tables'],
    keywords: ['steps', 'data tables'],
  },
  {
    name: 'Switch',
    title: 'common.switch',
    url: `/ui-components/switch`,
    categories: ['data tables'],
    keywords: ['switch', 'data tables'],
  },
  {
    name: 'Tabs',
    title: 'common.tabs',
    url: `/ui-components/tabs`,
    categories: ['data tables'],
    keywords: ['tabs', 'data tables'],
  },
  {
    name: 'Upload',
    title: 'common.upload',
    url: `/ui-components/upload`,
    categories: ['data tables'],
    keywords: ['upload', 'data tables'],
  },
];
