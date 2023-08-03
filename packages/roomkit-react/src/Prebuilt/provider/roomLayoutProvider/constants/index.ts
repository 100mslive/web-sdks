import type { Layout } from '@100mslive/types-prebuilt';
export const defaultLayout: Layout = {
  id: '',
  role_id: '',
  template_id: '',
  app_id: '',
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
            // @ts-ignore
            go_live_btn_label: 'Go Live',
          },
        },
      },
    },
    conferencing: {},
    leave: {},
  },
};
