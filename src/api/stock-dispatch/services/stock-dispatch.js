const { STOCK_DISPATCH } = require('../../../constants/models');

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService( STOCK_DISPATCH, ({ strapi }) => ({
    async calculateReservationDistribution(release, totalQuantityToRelease) {
        let remaining = totalQuantityToRelease;
        const reservations = [];
      
        for (const reservation of release.reservations) {
          const dispatched = reservation.dispatches.reduce((acc, d) => acc + d.quantity, 0);
          const available = reservation.quantity - dispatched;
      
          if (available > 0) {
            const allocate = Math.min(available, remaining);

            reservations.push( reservation.id );

            remaining -= allocate;
            
            if (remaining <= 0) break;
          }
        }
      
        return { reservations, remaining };
    },
}));
