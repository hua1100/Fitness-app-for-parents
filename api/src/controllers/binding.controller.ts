import { Request, Response } from 'express';
import { BindingService } from '../services/binding.service';
import { asyncHandler } from '../middlewares/error.middleware';

// 生成綁定碼
export const generateCode = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const result = await BindingService.generateCode(userId);

  res.json({
    success: true,
    data: result,
  });
});

// 使用綁定碼
export const useCode = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { code } = req.body;

  const binding = await BindingService.useCode(userId, code);

  res.json({
    success: true,
    data: binding,
  });
});

// 確認綁定
export const confirmBinding = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { bindingId } = req.body;

  const binding = await BindingService.confirmBinding(userId, bindingId);

  res.json({
    success: true,
    data: binding,
  });
});

// 取得綁定列表
export const getBindings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const bindings = await BindingService.getBindings(userId, userRole);

  res.json({
    success: true,
    data: bindings,
  });
});

// 取得待確認的綁定請求
export const getPendingBindings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const bindings = await BindingService.getPendingBindings(userId);

  res.json({
    success: true,
    data: bindings,
  });
});

// 解除綁定
export const unbind = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { bindingId } = req.params;

  await BindingService.unbind(userId, userRole, bindingId);

  res.json({
    success: true,
    data: { message: '已解除綁定' },
  });
});

// 拒絕綁定請求
export const rejectBinding = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { bindingId } = req.body;

  await BindingService.rejectBinding(userId, bindingId);

  res.json({
    success: true,
    data: { message: '已拒絕綁定請求' },
  });
});
