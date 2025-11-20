import mongoose from 'mongoose';

// Ultra-fast query utilities
export class QuickQuery {
  static async findFast<T>(model: any, filter = {}, limit = 20) {
    return model.find(filter)
      .lean()
      .limit(limit)
      .sort({ _id: -1 })
      .exec();
  }

  static async countFast(model: any, filter = {}) {
    return model.countDocuments(filter).exec();
  }

  static async findByIdFast<T>(model: any, id: string) {
    return model.findById(id).lean().exec();
  }

  static async updateFast(model: any, id: string, update: any) {
    return model.findByIdAndUpdate(id, update, { 
      new: true, 
      lean: true,
      runValidators: false 
    }).exec();
  }
}