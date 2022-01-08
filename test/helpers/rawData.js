 const axios = require('axios'); 
 require('dotenv').config({ path: __dirname+'/.env' }); 
 require("dotenv").config();

 const chainId = {'eth': 1, 'bsc': 56};
 const base_api = process.env.COVALENTHQ_BASE_API;
 const api_key = process.env.COVALENTHQ_API_KEY;

 const end_block = 13133268;
 const start_block = 7074618;
 const lock_tao_addr = "0x97633103048Fa891ffE9bbe645Ed68bd5eD3B2c1";

 class RawData {
    getHolderDataFromLockTao = async () => {
        return new Promise((resolve, reject) => {
            const api = base_api + chainId.bsc + "/tokens/" + lock_tao_addr + "/token_holders/?block-height="+end_block+"&page-size="+1000+"&key=" + api_key;

            axios.get(api).then((res) => {
              const res_data = res.data;
              if(res_data) {
                // console.log("====res::", res_data.data.items);          
                const temp = [];
                res_data.data.items.map((item, i) => {
                  const r_d = {'account': item.address, 'amount': item.balance, 'decimals':item.contract_decimals};
                  temp.push(r_d);
                });
                resolve(JSON.stringify(temp));
              }
            }).catch((err) => {
                console.log("====err::", err);
                reject();
            });
        })
    }
 }
 
 module.exports = {
    RawData,
 };