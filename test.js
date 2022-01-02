require('./envLoader');
const Bot = require('./main');

(async () => {
  const buyer = new Bot();

  const startDate = Date.now();
  console.log('Creating...');
  await buyer.create({
    // headless: false,
    // devtools: true,
  }, {
    username: process.env.EMAIL,
    password: process.env.PASS,
  });

  console.log(`Fetching item "${process.argv[2] || process.env.PAGE}"...`);
  await buyer.gotoItem(process.argv[2] || process.env.PAGE, true);
  // const { name, price, stock } = await buyer.gotoItem(process.argv[2] || process.env.PAGE);
  // console.log(`Item name: "${name}" ; Item price: ${price} € ; Available: ${stock === 'En stock'}`);

  // await buyer.refuseCookies();

  console.log('Adding to cart...');
  await buyer.addToCart();

  console.log('Authenticating...');
  await buyer.gotoAccount();

  console.log('Fetching cart...');
  const { total } = await buyer.gotoCart();
  console.log(`Total cart price: ${total} €`);

  console.log('Ordering...');
  await buyer.orderCart();

  console.log('Order confirmation...');
  await buyer.fillOrderForm({
    deliveryHomeMode: 1,
    // deliveryRelayAddress: '34090',

    cardNumber: process.env.CARD_NUMBER || '1111 2222 3333 4444',
    cardExpire: process.env.CARD_EXPIRE || '01/23',
    cardCrypto: process.env.CARD_CRYPTO || '012',
    cardOwner: process.env.CARD_OWNER || 'Mathieu Colmon',
  });

  console.log(`Done in ${Date.now() - startDate}ms`);
  buyer.close();
})();

// Search: https://www.ldlc.com/recherche/founder%20edition/+fcat-4684.html
