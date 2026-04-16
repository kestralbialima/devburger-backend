import Sequelize, { Model } from 'sequelize';

class Coupon extends Model {
  static init(sequelize) {
    super.init(
      {
        code: Sequelize.STRING,
        discountPercentage: Sequelize.INTEGER,
        isActive: Sequelize.BOOLEAN,
        // underscored:true faz o mapeamento automático:
        // expirationDate  → expiration_date (DATE)
        // limitPerUser    → limit_per_user  (INTEGER)
        expirationDate: Sequelize.DATE,
        limitPerUser: {
          type: Sequelize.INTEGER,
          defaultValue: 1,
        },
      },
      {
        sequelize,
        tableName: 'coupons',
        underscored: true,
        timestamps: true,
      }
    );

    return this;
  }
}

export default Coupon;
