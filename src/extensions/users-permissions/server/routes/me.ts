export default [
  {
    method: "GET",
    path: "/addresses/balance",
    handler: "me.getBalances",
    config: {
      prefix: "",
      policies: []
    }
  }
  // {
  //   method: "POST",
  //   path: "/address/add",
  //   handler: "me.addAddress",
  //   config: {
  //     prefix: "",
  //     policies: []
  //   }
  // }
];
