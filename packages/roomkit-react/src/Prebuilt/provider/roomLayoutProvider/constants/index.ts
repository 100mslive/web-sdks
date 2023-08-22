import type { Layout } from '@100mslive/types-prebuilt';
import { JoinForm_JoinBtnType } from '@100mslive/types-prebuilt/elements/join_form';

export const defaultLayout: Layout = {
  id: '',
  role_id: '',
  template_id: '',
  app_id: '',
  typography: {
    font_family: 'Inter',
  },
  themes: [],
  options: {},
  screens: {
    preview: {
      default: {
        elements: {
          preview_header: {
            title: 'Get Started',
            sub_title: 'Setup your audio and video before joining',
          },
          join_form: {
            join_btn_type: JoinForm_JoinBtnType.JOIN_BTN_TYPE_JOIN_AND_GO_LIVE,
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
