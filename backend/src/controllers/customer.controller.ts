import { Request, Response } from 'express';
import customerService from '../services/customer.service';
import { asyncHandler } from '../middlewares/errorHandler';
import { ApiError } from '../middlewares/errorHandler';
import { CustomerType, LoyaltyTier } from '@prisma/client';
import AuditService from '../services/audit.service';

export class CustomerController {
  /**
   * GET /api/customers
   * Get all customers with filters
   */
  getCustomers = asyncHandler(async (req: Request, res: Response) => {
    const {
      search,
      customerType,
      loyaltyTier,
      isActive,
      assignedSalesRep,
      page = '1',
      limit = '50',
    } = req.query;

    const filters = {
      ...(search && { search: search as string }),
      ...(customerType && { customerType: customerType as CustomerType }),
      ...(loyaltyTier && { loyaltyTier: loyaltyTier as LoyaltyTier }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(assignedSalesRep && { assignedSalesRep: assignedSalesRep as string }),
    };

    const result = await customerService.getCustomers(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.status(200).json({
      success: true,
      data: result.customers,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        totalPages: Math.ceil(result.total / parseInt(limit as string)),
      },
    });
  });

  /**
   * GET /api/customers/segment/:segment
   * Get customers by segment
   */
  getCustomersBySegment = asyncHandler(async (req: Request, res: Response) => {
    const { segment } = req.params;

    const customers = await customerService.getCustomersBySegment(segment);

    res.status(200).json({
      success: true,
      data: customers,
    });
  });

  /**
   * GET /api/customers/phone/:phone
   * Get customer by phone number
   */
  getCustomerByPhone = asyncHandler(async (req: Request, res: Response) => {
    const { phone } = req.params;

    const customer = await customerService.getCustomerByPhone(phone);

    res.status(200).json({
      success: true,
      data: customer,
    });
  });

  /**
   * GET /api/customers/:id
   * Get customer by ID
   */
  getCustomerById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const customer = await customerService.getCustomerWithStats(id);

    res.status(200).json({
      success: true,
      data: customer,
    });
  });

  /**
   * POST /api/customers
   * Create new customer
   */
  createCustomer = asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerService.createCustomer(req.body);

    // Audit log
    await AuditService.log(
      req.user!.userId,
      'CREATE',
      'Customer',
      customer.id,
      `Created customer: ${customer.name} (${customer.phone})`
    );

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
    });
  });

  /**
   * PUT /api/customers/:id
   * Update customer
   */
  updateCustomer = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const customer = await customerService.updateCustomer(id, req.body);

    // Audit log
    await AuditService.log(
      req.user!.userId,
      'UPDATE',
      'Customer',
      customer.id,
      `Updated customer: ${customer.name} (${customer.phone})`
    );

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer,
    });
  });

  /**
   * DELETE /api/customers/:id
   * Delete customer (soft delete)
   */
  deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await customerService.deleteCustomer(id);

    // Audit log
    await AuditService.log(
      req.user!.userId,
      'DELETE',
      'Customer',
      id,
      'Deactivated customer'
    );

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    });
  });

  /**
   * GET /api/customers/:id/history
   * Get customer purchase history
   */
  getPurchaseHistory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page = '1', limit = '20' } = req.query;

    const result = await customerService.getPurchaseHistory(
      id,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.status(200).json({
      success: true,
      data: result.history,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        totalPages: Math.ceil(result.total / parseInt(limit as string)),
      },
    });
  });

  /**
   * POST /api/customers/:id/loyalty/redeem
   * Redeem loyalty points
   */
  redeemLoyaltyPoints = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { points, description } = req.body;

    if (!points || points <= 0) {
      throw new ApiError(400, 'Points must be greater than 0');
    }

    const customer = await customerService.redeemLoyaltyPoints(
      id,
      points,
      description || 'Points redeemed'
    );

    res.status(200).json({
      success: true,
      message: 'Loyalty points redeemed successfully',
      data: customer,
    });
  });

  /**
   * POST /api/customers/:id/loyalty/adjust
   * Adjust loyalty points (manual adjustment)
   */
  adjustLoyaltyPoints = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { points, description } = req.body;

    if (!points) {
      throw new ApiError(400, 'Points value is required');
    }

    if (!description) {
      throw new ApiError(400, 'Description is required for manual adjustments');
    }

    const customer = await customerService.adjustLoyaltyPoints(
      id,
      points,
      description
    );

    res.status(200).json({
      success: true,
      message: 'Loyalty points adjusted successfully',
      data: customer,
    });
  });

  /**
   * GET /api/customers/:id/loyalty/history
   * Get loyalty transaction history
   */
  getLoyaltyHistory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page = '1', limit = '20' } = req.query;

    const result = await customerService.getLoyaltyHistory(
      id,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.status(200).json({
      success: true,
      data: result.history,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        totalPages: Math.ceil(result.total / parseInt(limit as string)),
      },
    });
  });

  /**
   * PATCH /api/customers/:id/loyalty/tier
   * Update customer loyalty tier based on points
   */
  updateLoyaltyTier = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const customer = await customerService.updateLoyaltyTier(id);

    res.status(200).json({
      success: true,
      message: 'Loyalty tier updated successfully',
      data: customer,
    });
  });
}

export default new CustomerController();
