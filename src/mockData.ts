export const CATEGORIES = [
  'Barchasi',
  'Trubalar',
  'Fitinglar',
  'Smesitellar',
  'Isitish',
  'Nasoslar',
  'Katta tovarlar',
  'Aksessuarlar'
];
import type { Product } from './types';
export type { Product };

const baseProducts = [
  // Trubalar
  { base: 'Truba (Oq)', cat: 'Trubalar', unit: 'metr', img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80', prices: [5000, 8000, 12000, 18000, 25000], sizes: ['20mm', '25mm', '32mm', '40mm', '50mm'] },
  { base: 'Truba (Kulrang)', cat: 'Trubalar', unit: 'metr', img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80', prices: [5500, 8500, 13000], sizes: ['20mm', '25mm', '32mm'] },
  { base: 'Kanalizatsiya trubasi', cat: 'Trubalar', unit: 'metr', img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80', prices: [15000, 25000, 45000], sizes: ['50mm', '75mm', '110mm'] },
  { base: 'Steklovolokno (Oq)', cat: 'Trubalar', unit: 'metr', img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80', prices: [9000, 14000, 22000, 32000, 50000], sizes: ['20mm', '25mm', '32mm', '40mm', '50mm'] },
  { base: 'Aluminli Truba (Qora)', cat: 'Trubalar', unit: 'metr', img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80', prices: [12000, 18000, 28000], sizes: ['20mm', '25mm', '32mm'] },

  // Fitinglar
  { base: 'Troynik Oq', cat: 'Fitinglar', unit: 'dona', img: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&q=80', prices: [2500, 3500, 6000, 10000, 15000], sizes: ['20mm', '25mm', '32mm', '40mm', '50mm'] },
  { base: 'Mufta Oq', cat: 'Fitinglar', unit: 'dona', img: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=500&q=80', prices: [1500, 2500, 4000, 7000, 10000], sizes: ['20mm', '25mm', '32mm', '40mm', '50mm'] },
  { base: 'Perexod Oq', cat: 'Fitinglar', unit: 'dona', img: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&q=80', prices: [3000, 4500, 8000], sizes: ['25x20mm', '32x20mm', '32x25mm'] },
  { base: 'Amerikanka (Ichki rezba)', cat: 'Fitinglar', unit: 'dona', img: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=500&q=80', prices: [18000, 25000, 35000], sizes: ['20x1/2"', '25x3/4"', '32x1"'] },
  { base: 'Amerikanka (Tashqi rezba)', cat: 'Fitinglar', unit: 'dona', img: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&q=80', prices: [19000, 26000, 37000], sizes: ['20x1/2"', '25x3/4"', '32x1"'] },
  { base: 'Otvod Kanalizatsiya 90', cat: 'Fitinglar', unit: 'dona', img: 'https://images.unsplash.com/photo-1621252179027-94459d278660?w=500&q=80', prices: [8000, 12000, 20000], sizes: ['50mm', '75mm', '110mm'] },
  { base: 'Otvod Kanalizatsiya 45', cat: 'Fitinglar', unit: 'dona', img: 'https://images.unsplash.com/photo-1621252179027-94459d278660?w=500&q=80', prices: [7500, 11000, 19000], sizes: ['50mm', '75mm', '110mm'] },
  { base: 'Troynik Kanalizatsiya', cat: 'Fitinglar', unit: 'dona', img: 'https://images.unsplash.com/photo-1621252179027-94459d278660?w=500&q=80', prices: [15000, 22000, 35000], sizes: ['50x50mm', '110x50mm', '110x110mm'] },

  // Smesitellar
  { base: 'Smesitel Vanna', cat: 'Smesitellar', unit: 'dona', img: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500&q=80', prices: [250000, 350000, 450000, 850000], sizes: ['Oddiy', 'Premium', 'Lyuks (Bronza)', 'Sensorli'] },
  { base: 'Smesitel Rakovina', cat: 'Smesitellar', unit: 'dona', img: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500&q=80', prices: [180000, 220000, 320000, 500000], sizes: ['Oddiy', 'Qora', 'Bronza', 'Gold'] },
  { base: 'Smesitel Oshxona (Kuhnya)', cat: 'Smesitellar', unit: 'dona', img: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500&q=80', prices: [150000, 250000, 400000, 600000], sizes: ['Egiluvchan', 'Baland', 'Filtrli', 'Sensorli'] },
  { base: 'Smesitel Dush qabul qilish', cat: 'Smesitellar', unit: 'dona', img: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500&q=80', prices: [400000, 600000, 1200000], sizes: ['Oddiy Stoyka', 'Tropik Dush', 'Termostatli'] },

  // Isitish
  { base: 'Radiator (Alumin)', cat: 'Isitish', unit: 'dona', img: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=500&q=80', prices: [500000, 650000, 800000, 1000000, 1200000], sizes: ['8 seksiyali', '10 seksiyali', '12 seksiyali', '15 seksiyali', '20 seksiyali'] },
  { base: 'Radiator (Bimetal)', cat: 'Isitish', unit: 'dona', img: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=500&q=80', prices: [600000, 750000, 950000], sizes: ['8 seksiyali', '10 seksiyali', '12 seksiyali'] },
  { base: 'Tyoply Pol Trubasi', cat: 'Isitish', unit: 'metr', img: 'https://images.unsplash.com/photo-1621252179027-94459d278660?w=500&q=80', prices: [8000, 10000, 15000], sizes: ['16mm PEX-A', '20mm PEX-A', '16mm Premium (Kislorod to\'siqli)'] },
  { base: 'Tyoply Pol Kollektori', cat: 'Isitish', unit: 'dona', img: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&q=80', prices: [450000, 650000, 850000, 1200000], sizes: ['3 kontur', '5 kontur', '7 kontur', '10 kontur'] },
  { base: 'Kotel 2 konturli', cat: 'Isitish', unit: 'dona', img: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=500&q=80', prices: [4500000, 5500000, 7500000, 12000000], sizes: ['24kW (Ariston)', '28kW (Navien)', '32kW', '40kW'] },
  { base: 'Ariston (Suv isitkich)', cat: 'Isitish', unit: 'dona', img: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=500&q=80', prices: [1200000, 1500000, 1800000, 2200000], sizes: ['50 Litr', '80 Litr', '100 Litr', '150 Litr'] },

  // Nasoslar
  { base: 'Sirkulyatsion Nasos', cat: 'Nasoslar', unit: 'dona', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&q=80', prices: [350000, 450000, 600000], sizes: ['25/4 (Shimge)', '25/6 (Wilo)', '32/8 (Grundfos)'] },
  { base: 'Suv tortuvchi Nasos', cat: 'Nasoslar', unit: 'dona', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&q=80', prices: [1200000, 1800000, 2500000], sizes: ['0.75kW', '1.1kW', '1.5kW'] },
  { base: 'Bosim oshiruvchi Nasos', cat: 'Nasoslar', unit: 'dona', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&q=80', prices: [450000, 650000], sizes: ['Oddiy (15/90)', 'Avtomat'] },

  // Katta tovarlar
  { base: 'Vanna', cat: 'Katta tovarlar', unit: 'dona', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&q=80', prices: [1200000, 1500000, 2500000, 3500000], sizes: ['150sm Akril', '170sm Akril', 'Burchakli', 'Chugun'] },
  { base: 'Unitaz', cat: 'Katta tovarlar', unit: 'dona', img: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=500&q=80', prices: [600000, 850000, 1500000, 2500000], sizes: ['Oddiy', 'Monoblok', 'Installyatsiya (Osiladigan)', 'Aqlli'] },
  { base: 'Moyka (Oshxona)', cat: 'Katta tovarlar', unit: 'dona', img: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500&q=80', prices: [250000, 450000, 800000], sizes: ['Oddiy (Nerjaveyka)', 'Qalin (3mm)', 'Granit'] },
  { base: 'Rakovina Tumbasi bilan', cat: 'Katta tovarlar', unit: 'dona', img: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=500&q=80', prices: [800000, 1200000, 2000000], sizes: ['60sm', '80sm', '100sm'] },
  { base: 'Dush Kabina', cat: 'Katta tovarlar', unit: 'dona', img: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500&q=80', prices: [2500000, 3500000, 5000000], sizes: ['90x90sm', '100x100sm', '120x80sm'] },

  // Aksessuarlar
  { base: 'Qog\'oz ushlagich', cat: 'Aksessuarlar', unit: 'dona', img: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=500&q=80', prices: [45000, 80000, 120000], sizes: ['Plastik', 'Xrom', 'Qora Mat'] },
  { base: 'Sochiq quritgich (Polotensesushitel)', cat: 'Aksessuarlar', unit: 'dona', img: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=500&q=80', prices: [350000, 500000, 800000], sizes: ['50x60sm Suvli', '50x80sm Suvli', 'Elektr'] },
  { base: 'Sifon', cat: 'Aksessuarlar', unit: 'dona', img: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&q=80', prices: [35000, 65000, 150000], sizes: ['Gofra', 'Avtomat', 'Xrom'] },
  { base: 'Jo\'mrak (Vintil)', cat: 'Aksessuarlar', unit: 'dona', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&q=80', prices: [45000, 65000], sizes: ['1/2"', '3/4"'] },
];

export const PRODUCTS: Product[] = (() => {
  const arr: Product[] = [];
  let id = 1;
  for (const item of baseProducts) {
    for (let i = 0; i < item.sizes.length; i++) {
      // Deterministic deterministic stock
      const stock = (id * 7) % 50; 
      arr.push({
        id: String(id++),
        name: `${item.base} ${item.sizes[i]}`,
        price: item.prices[i] || item.prices[item.prices.length - 1],
        unit: item.unit,
        category: item.cat,
        image: item.img,
        stock: stock
      });
    }
  }

  return arr;
})();
