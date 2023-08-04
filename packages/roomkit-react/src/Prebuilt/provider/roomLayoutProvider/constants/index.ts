import type { Layout } from '@100mslive/types-prebuilt';

// @ts-ignore
export const defaultLayout: Layout = {
  id: '',
  role_id: '',
  template_id: '',
  app_id: '',
  typography: {
    font_family: 'Inter',
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
            join_btn_type: 0,
            join_btn_label: 'Join Now',
            go_live_btn_label: 'Go Live',
          },
        },
      },
    },
    conferencing: {},
    leave: {},
  },
};
