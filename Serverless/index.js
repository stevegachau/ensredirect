const fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3("....."); // mainnet http rpc
const namehash = require('@ensdomains/eth-ens-namehash');
const { globSource, create } = require('ipfs-http-client');

exports.helloWorld = async (request, response) => {
  response.set('Access-Control-Allow-Origin', 'https://ensredirect.xyz');

  if (request.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    response.set('Access-Control-Allow-Methods', 'POST');
    response.set('Access-Control-Allow-Headers', 'Content-Type');
    response.set('Access-Control-Max-Age', '3600');
    response.status(204).send('');
    return;
  }

  const geturl = request.query.web;
  const newurl = geturl.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");
  const web = "https://" + newurl;
  const ens = request.query.ens;
  const addr = request.query.address;
  const address = addr.toLowerCase();
  const hash = namehash.hash(ens);

  const ownerMixedCase = await web3.eth.ens.getOwner(ens);
  const owner = ownerMixedCase.toLowerCase();

  if (owner !== address) {
    response.send({ status: "1", error: "Your address is not the controller of the provided ENS domain" });
    return;
  }

  const getResolver = await web3.eth.ens.getResolver(ens);
  const resolver = getResolver.options.address;

  if (resolver === "0x0000000000000000000000000000000000000000") {
    response.send({ status: "2", error: "Resolver address not set" });
    return;
  }

  const createHTML = require('create-html');

  const html = createHTML({
    title: 'Redirecting.....',
    head: '<meta  http-equiv="Content-Type" content="text/html;charset=UTF-8">',
    body: `<script>location.replace("${web}")</script>`,
  });

  const projectId = '.......'; //infura project id
  const projectSecret = '.........'; //infura project secret

  async function addFile() {
    const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

    const client = create({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https',
      path: 'api/v0',
      headers: {
        authorization: auth,
        'Content-Type': 'text/html',
      },
    });

    await fs.writeFile('/tmp/index.html', html, (err) => {
      if (err) console.log(err);
    });

    fs.readFile('/tmp/index.html', (err, data) => {
	    if (!err) {
        client.add(data).then((res) => {
          response.send({ status: "3", ipfs: res.path, resolver, hash });
        });
      }
    });
  }

  addFile();
};

     
