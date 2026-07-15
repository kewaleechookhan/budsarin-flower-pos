export function calculateCustomerTotalSpent(history = [], customerId) {
  return history.filter(item => item.customerId === customerId).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

export function calculateAverageOrderValue(history = [], customerId) {
  const rows = history.filter(item => item.customerId === customerId);
  return rows.length ? calculateCustomerTotalSpent(rows, customerId) / rows.length : 0;
}

export function calculateCustomerLifetimeValue(customer) {
  return Number(customer.totalSpent) || 0;
}

export function detectVIPCustomers(customers = []) {
  return customers.filter(item => Number(item.totalSpent) >= 20000 || Number(item.totalOrders) >= 10);
}

export function detectInactiveCustomers(customers = [], days = 90) {
  const threshold = Date.now() - days * 86400000;
  return customers.filter(item => item.lastOrderDate && new Date(item.lastOrderDate).getTime() < threshold);
}

export function segmentCustomer(customer) {
  if (Number(customer.totalSpent) >= 20000 || Number(customer.totalOrders) >= 10) return 'vip';
  if (customer.customerType === 'corporate') return 'corporate';
  if (customer.lastOrderDate && new Date(customer.lastOrderDate).getTime() < Date.now() - 90 * 86400000) return 'inactive';
  if (Number(customer.totalOrders) >= 3) return 'regular';
  if (Number(customer.totalOrders) <= 1) return 'new';
  return customer.customerSegment || 'lead';
}

export function buildCustomerGroups(customers = []) {
  return customers.reduce((groups, customer) => {
    const segment = segmentCustomer(customer);
    groups[segment] = groups[segment] || [];
    groups[segment].push({ ...customer, customerSegment: segment });
    return groups;
  }, {});
}
