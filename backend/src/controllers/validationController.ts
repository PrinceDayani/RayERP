// project\backend\src\controllers\validationController.ts

import { Request, Response } from 'express';
import Inventory from '../models/Inventory';
import Product from '../models/Product';
import Customer from '../models/Customer';
import { logger } from '../utils/logger';

// Validate inventory stock levels for a list of products
export const validateInventoryStock = async (req: Request, res: Response) => {
  try {
    const { products } = req.body;
    
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        message: 'Products array is required'
      });
    }
    
    // Array to collect validation results
    const results = [];
    let allValid = true;
    
    // Check each product in the request
    for (const item of products) {
      const { product: productId, quantity } = item;
      
      if (!productId || !quantity) {
        results.push({
          productId,
          valid: false,
          message: 'Product ID and quantity are required',
          requested: quantity,
          available: 0
        });
        allValid = false;
        continue;
      }
      
      // Find inventory for this product
      const inventory = await Inventory.findOne({ productId })
        .populate('productId', 'name sku price');
      
      if (!inventory) {
        // No inventory record found
        results.push({
          productId,
          valid: false,
          message: 'No inventory record found',
          requested: quantity,
          available: 0,
          product: await Product.findById(productId).select('name sku')
        });
        allValid = false;
        continue;
      }
      
      // Check if quantity is available
      if (inventory.quantity < quantity) {
        results.push({
          productId,
          valid: false,
          message: 'Insufficient stock',
          requested: quantity,
          available: inventory.quantity,
          product: inventory.productId
        });
        allValid = false;
      } else {
        results.push({
          productId,
          valid: true,
          message: 'Stock available',
          requested: quantity,
          available: inventory.quantity,
          product: inventory.productId
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      valid: allValid,
      results
    });
  } catch (error) {
    logger.error(`Error validating inventory: ${error}`);
    return res.status(500).json({
      success: false,
      message: 'Server error while validating inventory'
    });
  }
};

// Validate customer credit status
export const validateCustomerCredit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { orderAmount } = req.query;
    
    const customer = await Customer.findById(id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Basic validation results
    const results = {
      customerId: id,
      name: customer.name,
      active: customer.active,
      creditStatus: customer.creditStatus || 'good',
      creditLimit: customer.creditLimit || 0,
      totalSpent: customer.totalSpent || 0,
      warnings: [] as string[]
    };
    
    // Check for inactive account
    if (!customer.active) {
      results.warnings.push('Customer account is inactive');
    }
    
    // Check credit status
    if (customer.creditStatus === 'hold') {
      results.warnings.push('Customer credit is on hold');
    } else if (customer.creditStatus === 'review') {
      results.warnings.push('Customer credit needs review');
    }
    
    // Check credit limit if order amount provided
    if (orderAmount && customer.creditLimit) {
      const amount = parseFloat(orderAmount as string);
      if (!isNaN(amount) && amount > customer.creditLimit) {
        results.warnings.push('Order amount exceeds customer credit limit');
      }
    }
    
    return res.status(200).json({
      success: true,
      valid: results.warnings.length === 0,
      data: results
    });
  } catch (error) {
    logger.error(`Error validating customer credit: ${error}`);
    return res.status(500).json({
      success: false,
      message: 'Server error while validating customer credit'
    });
  }
};

// Pre-validate an entire order before submission
export const validateOrder = async (req: Request, res: Response) => {
  try {
    const { customer, products, totalAmount } = req.body;
    
    if (!customer || !products || !Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        message: 'Customer and products array are required'
      });
    }
    
    // Validate inventory
    const inventoryResults = [];
    let inventoryValid = true;
    
    for (const item of products) {
      const { product: productId, quantity } = item;
      
      const inventory = await Inventory.findOne({ productId })
        .populate('productId', 'name sku price');
      
      if (!inventory) {
        inventoryResults.push({
          productId,
          valid: false,
          message: 'No inventory record found',
          requested: quantity,
          available: 0
        });
        inventoryValid = false;
        continue;
      }
      
      if (inventory.quantity < quantity) {
        inventoryResults.push({
          productId,
          valid: false,
          message: 'Insufficient stock',
          requested: quantity,
          available: inventory.quantity,
          product: inventory.productId
        });
        inventoryValid = false;
      } else {
        inventoryResults.push({
          productId,
          valid: true,
          message: 'Stock available',
          requested: quantity,
          available: inventory.quantity,
          product: inventory.productId
        });
      }
    }
    
    // Validate customer
    const customerObj = await Customer.findById(customer);
    
    if (!customerObj) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    const customerWarnings = [];
    
    if (!customerObj.active) {
      customerWarnings.push('Customer account is inactive');
    }
    
    if (customerObj.creditStatus === 'hold') {
      customerWarnings.push('Customer credit is on hold');
    } else if (customerObj.creditStatus === 'review') {
      customerWarnings.push('Customer credit needs review');
    }
    
    if (totalAmount && customerObj.creditLimit && totalAmount > customerObj.creditLimit) {
      customerWarnings.push('Order amount exceeds customer credit limit');
    }
    
    // Combine results
    return res.status(200).json({
      success: true,
      valid: inventoryValid && customerWarnings.length === 0,
      inventory: {
        valid: inventoryValid,
        results: inventoryResults
      },
      customer: {
        valid: customerWarnings.length === 0,
        customer: {
          id: customerObj._id,
          name: customerObj.name,
          active: customerObj.active,
          creditStatus: customerObj.creditStatus || 'good',
          creditLimit: customerObj.creditLimit || 0
        },
        warnings: customerWarnings
      }
    });
  } catch (error) {
    logger.error(`Error validating order: ${error}`);
    return res.status(500).json({
      success: false,
      message: 'Server error while validating order'
    });
  }
};