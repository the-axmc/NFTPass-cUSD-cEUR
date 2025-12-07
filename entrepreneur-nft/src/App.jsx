import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { abi } from './abi';

const CONTRACT_ADDRESS = '0x35050de3D73e58019890150f59124A57998892A3';
const ERC20_ABI = [
  'function approve(address spender, uint amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address owner) view returns (uint)',
];

const TOKENS = {
  cUSD: {
    address: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    amount: '55',
    uri: 'https://crimson-peaceful-impala-136.mypinata.cloud/ipfs/bafkreibtufgl4hemdz5deuwr3hmih4fxhtex3swuxgmvekz4sc3wzm4ooi',
  },
  cEUR: {
    address: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
    amount: '50',
    uri: 'https://crimson-peaceful-impala-136.mypinata.cloud/ipfs/bafkreibtufgl4hemdz5deuwr3hmih4fxhtex3swuxgmvekz4sc3wzm4ooi',
  }
};

function App() {
  const [wallet, setWallet] = useState('');
  const [currency, setCurrency] = useState('cUSD');
  const [minting, setMinting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [balances, setBalances] = useState({});
  const [nftData, setNftData] = useState(null);
  const [destinations, setDestinations] = useState({ axmcSafe: '', treasury: '' });

  useEffect(() => {
    if (wallet) fetchBalances();
  }, [wallet]);

  useEffect(() => {
    loadContractDestinations();
  }, [wallet]);

  async function connectWallet() {
    const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setWallet(account);
  }

  async function fetchBalances() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    const newBalances = {};
    for (const key of Object.keys(TOKENS)) {
      const token = TOKENS[key];
      const erc20 = new ethers.Contract(token.address, ERC20_ABI, provider);
      const decimals = await erc20.decimals();
      const raw = await erc20.balanceOf(address);
      newBalances[key] = Number(ethers.formatUnits(raw, decimals));
    }
    setBalances(newBalances);
  }

  async function loadContractDestinations() {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
      const [axmcSafe, treasury] = await Promise.all([
        contract.axmcSafe(),
        contract.treasury(),
      ]);
      setDestinations({ axmcSafe, treasury });
    } catch (err) {
      console.error('❌ Failed to load payout destinations:', err);
    }
  }

  async function loadMemberPass(contract, address) {
    const balance = await contract.balanceOf(address);
    if (balance > 0n) {
      for (let i = 1; i <= 200; i++) {
        try {
          const owner = await contract.ownerOf(i);
          if (owner.toLowerCase() === address.toLowerCase()) {
            const tokenUri = await contract.tokenURI(i);
            const metadata = await fetch(tokenUri).then(res => res.json());
            return { id: String(i), ...metadata };
          }
        } catch (_) {}
      }
    }
    return null;
  }

  function shorten(address = '') {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  async function mintMembership() {
    setMinting(true);
    let contract;
    let address;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      address = await signer.getAddress();
      const token = TOKENS[currency];

      const erc20 = new ethers.Contract(token.address, ERC20_ABI, signer);
      const decimals = await erc20.decimals();
      const amount = ethers.parseUnits(token.amount, decimals);

      console.log("🔐 Approving...");
      const approveTx = await erc20.approve(CONTRACT_ADDRESS, amount);
      await approveTx.wait();

      console.log("📄 Accepting terms...");
      const acceptTx = await contract.acceptTerms();
      await acceptTx.wait();

      console.log("🚀 Minting...");
      const mintTx = await contract.mint(
        currency === 'cUSD' ? 0 : 1,
        token.address,
        token.uri
      );
      const receipt = await mintTx.wait();

      console.log("📦 Parsing event logs...");
      const parsed = receipt.logs
        .map(log => {
          try {
            return contract.interface.parseLog(log);
          } catch (_) {
            return null;
          }
        })
        .find(log => log && log.name === 'MembershipMinted');
      const tokenId = parsed?.args?.tokenId ?? parsed?.args?.[1];

      if (!tokenId) {
        const existingPass = await loadMemberPass(contract, address);
        if (!existingPass) {
          throw new Error('Event parsing failed');
        }
        setNftData(existingPass);
        return;
      }

      const tokenUri = await contract.tokenURI(tokenId);
      const metadata = await fetch(tokenUri).then(res => res.json());
      const mintedId = tokenId.toString();
      setNftData({ id: mintedId, ...metadata });

    } catch (err) {
      console.error('❌ Minting failed:', err);

      const alreadyMinted = err?.message?.includes('Already minted');
      if (alreadyMinted) {
        alert('🎟 You already minted this Pass! Loading your dashboard...');
        try {
          if (!contract || !address) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
            address = await signer.getAddress();
          }
          const existingPass = await loadMemberPass(contract, address);
          if (existingPass) {
            setNftData(existingPass);
            return;
          }
        } catch (dashboardError) {
          console.error("❌ Error loading dashboard:", dashboardError);
          alert("Could not load your pass. Try again or contact support.");
        }
      } else {
        alert('Minting failed. See console.');
      }
    } finally {
      setMinting(false);
    }
  }

  const canMint = wallet && acceptedTerms && balances[currency] >= Number(TOKENS[currency].amount);

  return (
    <div style={{ fontFamily: 'Arial', padding: '2rem', background: '#111', color: '#fff', minHeight: '100vh' }}>
      {!nftData ? (
        <>
          <h1>Claim your entrepreneur pass with cUSD/cEUR</h1>

          {!wallet ? (
            <button onClick={connectWallet}>Connect Wallet</button>
          ) : (
            <p>✅ Connected: {wallet}</p>
          )}

          {wallet && (
            <>
              <div style={{ marginTop: '1rem' }}>
                <label>Choose Payment:</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)}>
                  {Object.entries(TOKENS).map(([key, token]) => (
                    <option key={key} value={key} disabled={balances[key] < Number(token.amount)}>
                      {key} ({token.amount}) — Balance: {balances[key]?.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {(destinations.axmcSafe || destinations.treasury) && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#181818', borderRadius: '0.75rem', border: '1px solid #222' }}>
                  <p style={{ margin: 0 }}>Funds route on-chain to:</p>
                  {destinations.axmcSafe && <p style={{ margin: '0.35rem 0 0 0' }}>AXMC Safe: {shorten(destinations.axmcSafe)}</p>}
                  {destinations.treasury && <p style={{ margin: '0.35rem 0 0 0' }}>Treasury: {shorten(destinations.treasury)}</p>}
                  <p style={{ margin: '0.35rem 0 0 0', color: '#aaa', fontSize: '0.9rem' }}>Membership contract: {shorten(CONTRACT_ADDRESS)}</p>
                </div>
              )}

              <div style={{ marginTop: '1rem' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={e => setAcceptedTerms(e.target.checked)}
                  />
                  {' '}I accept the <a href="/terms" target="_blank">Terms</a> & <a href="/privacy" target="_blank">Privacy</a>.
                </label>
              </div>

              <button
                style={{ marginTop: '1rem' }}
                disabled={!canMint || minting}
                onClick={mintMembership}
              >
                {minting ? '⏳ Minting...' : 'Collect Pass'}
              </button>
            </>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <h2>🎉 Success! You now own an AXMC Entrepreneur pass</h2>
          <p><strong>Token ID:</strong> {nftData.id}</p>
          <img src={nftData.image} alt="NFT" style={{ width: '300px', borderRadius: '1rem', marginTop: '1rem' }} />
          <p><strong>Name:</strong> {nftData.name}</p>
          <p><strong>Description:</strong> {nftData.description}</p>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
            <iframe
              src="https://crimson-peaceful-impala-136.mypinata.cloud/ipfs/bafybeiayw5aizhhy25dqj672mksnyuie4o5syzxeo4vlpnlp3px6m7jk4y"
              title="AXMC Entrepreneur"
              style={{
                width: '300px',
                height: '300px',
                border: 'none',
                borderRadius: '1rem',
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.1)',
              }}
              allow="fullscreen"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
