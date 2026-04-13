---
name: Role permissions
description: Role-based access control — Super Admin (admin), Admin (manager), Agent restrictions
type: feature
---
## Roles
- **Super Admin** (db role: `admin`) — Owner of CRM, full access to everything
- **Admin** (db role: `manager`) — Can manage all agents, view all leads, edit lead details
- **Agent** (db role: `agent`) — Can only: call leads, update status/temperature, add alternative number, add comments

## Enforcement
- DB trigger `restrict_agent_lead_updates` reverts unauthorized field changes for agents
- UI hides "Edit Lead Details" section for agents
- Sidebar shows role-appropriate labels: Super Admin / Admin / Agent
- Agents page & Reports page hidden from agents in sidebar
