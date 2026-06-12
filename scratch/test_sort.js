const { xdr } = require('@stellar/stellar-sdk');

const keys = [
  xdr.ScVal.scvSymbol('max_revisions'),
  xdr.ScVal.scvSymbol('payout_amount_usd'),
  xdr.ScVal.scvSymbol('revisions_used'),
  xdr.ScVal.scvSymbol('state')
];

for (const k of keys) {
  const bytes = k.toXDR();
  console.log(k.symbol().toString(), '->', bytes.toString('hex'), 'len:', bytes.length);
}

keys.sort((a, b) => {
  const aBytes = a.toXDR();
  const bBytes = b.toXDR();
  return aBytes.compare(bBytes);
});

console.log('Sorted order:');
for (const k of keys) {
  console.log(k.symbol().toString());
}
