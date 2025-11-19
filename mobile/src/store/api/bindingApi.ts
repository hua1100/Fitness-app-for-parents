import { baseApi, ApiResponse } from './baseApi';
import { Binding, User } from '../../types';

// 綁定碼響應
interface GenerateCodeResponse {
  code: string;
  expiresAt: string;
  expiresIn: number;
}

// 綁定 API
export const bindingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 生成綁定碼（長輩）
    generateCode: builder.mutation<ApiResponse<GenerateCodeResponse>, void>({
      query: () => ({
        url: '/binding/generate-code',
        method: 'POST',
      }),
    }),

    // 使用綁定碼（子女）
    useCode: builder.mutation<ApiResponse<Binding>, { code: string }>({
      query: (body) => ({
        url: '/binding/use-code',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Binding'],
    }),

    // 確認綁定（長輩）
    confirmBinding: builder.mutation<ApiResponse<Binding>, { bindingId: string }>({
      query: (body) => ({
        url: '/binding/confirm',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Binding'],
    }),

    // 拒絕綁定（長輩）
    rejectBinding: builder.mutation<ApiResponse<{ message: string }>, { bindingId: string }>({
      query: (body) => ({
        url: '/binding/reject',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Binding'],
    }),

    // 取得綁定列表
    getBindings: builder.query<ApiResponse<Binding[]>, void>({
      query: () => '/binding',
      providesTags: ['Binding'],
    }),

    // 取得待確認綁定請求（長輩）
    getPendingBindings: builder.query<ApiResponse<Binding[]>, void>({
      query: () => '/binding/pending',
      providesTags: ['Binding'],
    }),

    // 解除綁定
    unbind: builder.mutation<ApiResponse<{ message: string }>, string>({
      query: (bindingId) => ({
        url: `/binding/${bindingId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Binding'],
    }),
  }),
});

export const {
  useGenerateCodeMutation,
  useUseCodeMutation,
  useConfirmBindingMutation,
  useRejectBindingMutation,
  useGetBindingsQuery,
  useGetPendingBindingsQuery,
  useUnbindMutation,
} = bindingApi;
