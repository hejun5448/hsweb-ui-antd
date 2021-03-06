import { routerRedux } from 'dva/router';
import { Reducer, AnyAction } from 'redux';
import { EffectsCommandMap } from 'dva';
import { stringify, parse } from 'qs';
import { loginOut } from '@/pages/user-login/service';
import { reloadAuthorized } from '@/utils/Authorized';
import { clearAutz } from '@/utils/authority';

export function getPageQuery() {
  return parse(window.location.href.split('?')[1]);
}

export type Effect = (
  action: AnyAction,
  effects: EffectsCommandMap & { select: <T>(func: (state: {}) => T) => T },
) => void;

export interface ModelType {
  namespace: string;
  state: {};
  effects: {
    logout: Effect;
  };
  reducers: {
    changeLoginStatus: Reducer<{}>;
  };
}

const Model: ModelType = {
  namespace: 'login',

  state: {
    status: undefined,
  },

  effects: {
    *logout(_, { call, put }) {
      const response = yield call(loginOut);
      if (response.status === 200) {
        yield put({
          type: 'changeLoginStatus',
          payload: {
            status: response.status,
            result: {
              currentAuthority: 'guest',
            },
          },
        });
        clearAutz();
        reloadAuthorized();
        const { redirect } = getPageQuery();
        // redirect
        if (window.location.pathname !== '/user/login' && !redirect) {
          yield put(
            routerRedux.replace({
              pathname: '/user/login',
              search: stringify({
                redirect: window.location.href,
              }),
            }),
          );
        }
      }
    },
  },

  reducers: {
    changeLoginStatus(state, { payload }) {
      return {
        ...state,
        status: payload.status,
        type: payload.type,
      };
    },
  },
};

export default Model;
