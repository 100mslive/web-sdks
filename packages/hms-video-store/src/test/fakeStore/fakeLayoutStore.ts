// import { Layout } from '@100mslive/types-prebuilt';

export const sampleLayout = {
  id: '',
  role_id: '',
  template_id: '',
  app_id: '',
  themes: [
    {
      name: 'default',
      default: true,
      palette: {
        primary_default: '#2572ED',
        primary_bright: '#538DFF',
        primary_dim: '#002D6D',
        primary_disabled: '#004299',
        on_primary_high: '#FFFFFF',
        on_primary_medium: '#CCDAFF',
        on_primary_low: '#84AAFF',
        secondary_default: '#444954',
        secondary_bright: '#70778B',
        secondary_dim: '#293042',
        secondary_disabled: '#404759',
        on_secondary_high: '#FFFFFF',
        on_secondary_medium: '#D3D9F0',
        on_secondary_low: '#A4ABC0',
        background_default: '#0B0E15',
        background_dim: '#000000',
        surface_default: '#191B23',
        surface_bright: '#272A31',
        surface_brighter: '#2E3038',
        surface_dim: '#11131A',
        on_surface_high: '#EFF0FA',
        on_surface_medium: '#C5C6D0',
        on_surface_low: '#8F9099',
        border_default: '#1D1F27',
        border_bright: '#272A31',
        alert_success: '#36B37E',
        alert_warning: '#FFAB00',
        alert_error_default: '#C74E5B',
        alert_error_bright: '#FFB2B6',
        alert_error_brighter: '#FFEDEC',
        alert_error_dim: '#270005',
      },
    },
  ],
  typography: {
    font_family: 'Inter',
  },
  logo: {
    url: 'https://storage.googleapis.com/100ms-cms-prod/cms/Video_Conf_bbd113b5d0/Video_Conf_bbd113b5d0.svg',
  },
  screens: {
    preview: {
      live_streaming: {
        elements: {
          preview_header: {
            title: 'Get Started',
            sub_title: 'Setup your audio and video before joining',
          },
          join_form: {
            join_btn_type: 1,
            join_btn_label: 'Go Live',
          },
        },
      },
    },
    conferencing: {},
    leave: {},
  },
};
