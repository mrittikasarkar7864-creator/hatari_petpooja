// Api/Global_Api.js
export const BASE_URL = 'https://hatari.backend.sensegeofence.com/api/';
export const petpooja_url ='https://petpooja.sensegeofence.com/api/'
// export const BASE_URL = 'https://api.hatarirestaurant.com/api/';

// export const BASE_URL  = 'http://192.168.1.13:3006/api/'
export const API = {
  sendOtp: `${petpooja_url}auth/otp/send`,
  verifyOtp: `${petpooja_url}auth/otp/verify`,
  nearestRasturance: `${petpooja_url}restaurants`,
  allRestaurant: `${petpooja_url}restaurants`,
  
  getbannerHome : `${BASE_URL}banner/getAll`,
  // getallfoods : `${petpooja_url}petpooja/normalized-menu?restaurantId=52120`,
  // getCatItemfoods : `${petpooja_url}petpooja/normalized-menu?restaurantId=52120`,
  getfoodpagination : `${petpooja_url}petpooja/normalized-menu`,
  postandUploadCat : `${petpooja_url}cart/update`,
  postCatAdd : `${petpooja_url}cart/update`,
  getPetpoojaCart : `${petpooja_url}cart`,
  postPetpoojaCartUpdate: `${petpooja_url}cart/update`,
  getPetpoojaCartCalculate: `${petpooja_url}cart/calculate`,
  postPetpoojaCartCalculate: `${petpooja_url}cart/calculate`,
  postPetpoojaCartRemove: `${petpooja_url}cart/remove`,
  AllFoodCat :`${BASE_URL}catfood/allFoodCatActive`,
  customizeFood:`${BASE_URL}cart/add`,
  getmenutemfoods : `${BASE_URL}food/foods`,
  addAddressPost:`${BASE_URL}users/addAddress`,
  deliverySettings :`${BASE_URL}setting/deliverySettings`,
  tableBooking :`${BASE_URL}booking`,
  coupon :`${BASE_URL}coupon/active`,
  billing:`${BASE_URL}billing/create`,
  getfoodOrder :`${BASE_URL}billing`,
  saveaddress: `${BASE_URL}users/getUserAddress`,
  getAllSubCategory:`${BASE_URL}catfood/getAllSubCategory`,
  searchFood:`${BASE_URL}food/filter`,
  Categoryitem :`${BASE_URL}food/by`,
  profile:`${BASE_URL}profile/getMyProfile`,
  AddressDelete : `${BASE_URL}users/address/delete`,
  GetAllCategory: `${BASE_URL}catfood/getAllCategory`,
  GetMainCat: `${BASE_URL}catfood/getMainCat`,
  GetAllSubCategory: `${BASE_URL}catfood/getAllSubCategory2`

};