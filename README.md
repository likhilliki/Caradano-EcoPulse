# EcoPulse - Cardano Air Quality Monitor

A production-ready, full-stack dApp that monitors real-time air quality using geolocation and OpenWeatherMap API, generates ECO tokens through Masumi Agent verification based on air quality metrics, and enables token-to-ADA exchange on the Cardano blockchain.

## 🌍 Features

### Core Features
- **Real-time AQI Monitoring** - Live air quality data from OpenWeatherMap API with geolocation tracking
- **Wallet Integration** - Multi-wallet support (Eternl, Nami, MetaMask) using CIP-30 standard
- **ECO Token Rewards** - Automatic hourly token distribution based on air quality levels:
  - Excellent (AQI 0-25): 50 tokens
  - Good (AQI 26-50): 35 tokens
  - Moderate (AQI 51-100): 20 tokens
  - Unhealthy (AQI 101+): 3-10 tokens
- **Token Exchange** - Swap ECO tokens for ADA on Cardano blockchain
- **Live Map** - Interactive Leaflet-based map showing air quality data globally
- **User Authentication** - JWT-based authentication with PostgreSQL backend

### Agent System
- **Masumi Agent Verification** - Autonomous verification system for AQI submissions
- **Two-Agent Architecture**:
  - **Agent Verifier** - Validates AQI data and calculates verification scores
  - **Agent Rewards** - Processes token rewards and batch distributions
- **Smart Contract Validation** - Aiken-based validators for on-chain token minting
- **Hourly Token Claims** - One-click reward claiming with cooldown enforcement

## 🏗️ Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Components**: Radix UI with Tailwind CSS
- **State Management**: TanStack React Query
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Blockchain**: Lucid Cardano SDK for wallet integration

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with bcryptjs hashing
- **API**: RESTful with middleware authentication
- **Blockchain Integration**: Blockfrost API for Cardano interaction

### Smart Contracts
- **Language**: Aiken
- **Validators**: AQI rewards minting policy with token distribution rules
- **Tests**: Built-in Aiken test suite for contract validation

### Database Schema
- **users** - User authentication and profiles
- **aqi_readings** - Historical AQI data points
- **tokens** - Token balance tracking
- **agent_verifications** - Verification records with scores
- **agent_submissions** - AQI submission history

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL
- Cardano wallet (Eternl, Nami, or MetaMask)
- OpenWeatherMap API key
- Blockfrost API key (Mainnet)

### Environment Setup
```bash
# Clone the repository
git clone https://github.com/likhilliki/EcoPulse.git
cd EcoPulse

# Install dependencies
npm install

# Set up environment variables
# Add your API keys to environment configuration
# - OpenWeatherMap API key
# - Blockfrost Mainnet API key
# - PostgreSQL connection string

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

The app will be available at `http://localhost:5000`

## 📱 Usage

### For Air Quality Monitors
1. **Sign Up** - Create account with email/password
2. **Connect Wallet** - Link your Cardano wallet (Eternl/Nami/MetaMask)
3. **Claim Rewards** - Click "Claim Hourly AQI Reward" button to earn tokens based on current air quality
4. **View Stats** - Check verification history, total tokens earned, and verification scores
5. **Swap Tokens** - Exchange ECO tokens for ADA through the Token Swap interface

### Dashboard Features
- **Agent Verification Stats** - Total submissions, verified count, tokens earned
- **Real-time AQI Display** - Current air quality level and historical trends
- **Verification History** - Complete record of all verifications with timestamps
- **Wallet Status** - Connected wallet address and balance display

### Live Map
- View air quality data points globally
- Click markers to see detailed AQI information
- Real-time data from OpenWeatherMap API

## 🔐 Security

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcryptjs with salt rounds for password security
- **Smart Contract Validation** - On-chain validators prevent invalid token minting
- **Hourly Cooldown** - Prevents duplicate reward claims
- **Environment Secrets** - API keys stored securely in environment variables

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Agent System
- `POST /api/agent/submit` - Submit AQI data for verification
- `GET /api/agent/stats` - Get verification statistics
- `GET /api/agent/verifications` - Get verification history

### User Data
- `GET /api/user/profile` - Get user profile
- `GET /api/user/tokens` - Get token balance

## 🛠️ Development

### Project Structure
```
.
├── client/                 # React frontend
│   └── src/
│       ├── pages/         # Page components
│       ├── components/    # UI components
│       ├── hooks/         # Custom React hooks
│       └── lib/           # Utility libraries
├── server/                # Express backend
│   ├── agents/           # Masumi Agent system
│   │   ├── agent-config.ts
│   │   ├── agent-verifier.ts
│   │   └── agent-rewards.ts
│   ├── auth.ts           # Authentication logic
│   ├── cardano.ts        # Cardano integration
│   ├── storage.ts        # Database interface
│   └── routes.ts         # API routes
├── shared/               # Shared types and schemas
│   └── schema.ts         # Drizzle ORM schema
└── contracts/            # Aiken smart contracts
    └── aqi_rewards.aiken # Reward minting validator
```

### Database Migrations
```bash
# Generate migrations from schema
npm run db:generate

# Apply migrations
npm run db:push

# Reset database (development only)
npm run db:reset
```

### Running Tests
```bash
# Run Aiken contract tests
cd contracts
aiken check
aiken build
```

## 🔄 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Hosting
- Deploy to Replit, Heroku, or any Node.js hosting platform
- Set PostgreSQL connection string in environment
- Configure Cardano testnet/mainnet endpoints
- Set API keys for OpenWeatherMap and Blockfrost

## 📈 Token Economics

- **Reward Distribution**: Based on air quality levels to incentivize clean air monitoring
- **Verification Score**: 0-100 based on data validity and consistency
- **Hourly Claims**: One reward per hour maximum per user
- **Token Supply**: Mint tokens on demand through smart contract validation

## 🌐 Blockchain Integration

### Cardano Mainnet
- Smart contract validated token minting
- CIP-30 wallet standard support
- Blockfrost oracle feeds for data validation
- Token-to-ADA exchange on DEX

### Supported Wallets
- **Eternl Wallet** - Full CIP-30 support
- **Nami Wallet** - Full CIP-30 support
- **MetaMask** - Cardano bridge support

## 📝 Smart Contract Details

The Aiken contract validates:
- AQI data is within valid range (0-500)
- Data is recent (within last hour)
- User address is valid
- Token amounts match reward levels
- No double-claiming within cooldown period

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🙋 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review API endpoint documentation

## 🎯 Future Roadmap

- [ ] Multi-chain support (Ethereum, Polygon)
- [ ] Advanced analytics dashboard
- [ ] Community leaderboards
- [ ] IoT sensor integration
- [ ] Mobile app (React Native)
- [ ] Governance token ($PULSE)
- [ ] DAO treasury management
- [ ] AI-powered predictive analytics

## 👨‍💻 Built with

- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Express.js](https://expressjs.com)
- [Drizzle ORM](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [Cardano](https://cardano.org)
- [Aiken](https://aiken-lang.org)
- [Lucid SDK](https://lucid.spacebudz.io)

---

**EcoPulse** - Monetizing Environmental Data on Cardano 🌍💚
