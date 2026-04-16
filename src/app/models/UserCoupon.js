import Sequelize, { Model } from 'sequelize';

class UserCoupon extends Model {
  static init(sequelize) {
    super.init(
      {
        // user_id e coupon_id são as FKs (gerenciadas pelo Sequelize via associate)
        usedAt: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
      },
      {
        sequelize,
        tableName: 'user_coupons',
        underscored: true,
        timestamps: true,
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: { name: 'user_id', type: 'UUID' }, as: 'user' });
    this.belongsTo(models.Coupon, { foreignKey: 'coupon_id', as: 'coupon' });
  }
}

export default UserCoupon;
