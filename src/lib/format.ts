export const formatPrice = (amount: number): string => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " so'm";
};

export const formatDate = (dateString: string): string => {
  const d = new Date(dateString);
  const months = ['Yan', 'Fev', 'Mart', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
  return `${d.getDate()}-${months[d.getMonth()]}, ${d.getFullYear()}`;
};
