import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, ChevronRight, Copy, Check } from 'lucide-react'
import { useOrgStore } from '../store/orgStore'

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'step1', label: '1. Create an Org' },
  { id: 'step2', label: '2. Register Your App' },
  { id: 'step3', label: '3. Auth Code Flow' },
  { id: 'step4', label: '4. Validate JWT' },
  { id: 'step5', label: '5. Use JWT Claims' },
  { id: 'claims', label: 'JWT Claims Reference' },
  { id: 'endpoints', label: 'Endpoint Reference' },
]

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      borderRadius: '0.625rem', overflow: 'hidden',
      border: '1px solid var(--border)', margin: '0.875rem 0',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.4rem 0.875rem',
        background: 'var(--surface-2)', borderBottom: '1px solid var(--border)',
      }}>
        <span style={{
          fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-3)',
          textTransform: 'uppercase', letterSpacing: '0.07em',
        }}>{lang}</span>
        <button
          onClick={copy}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '0.25rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: copied ? 'var(--success)' : 'var(--text-3)',
            fontFamily: 'inherit', transition: 'color 0.15s',
          }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{
        padding: '1rem 1.125rem',
        background: '#0d1117',
        color: '#c9d1d9',
        fontSize: '0.8rem',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        lineHeight: 1.7,
        overflowX: 'auto',
        margin: 0,
        whiteSpace: 'pre',
      }}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

function SectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} style={{
      fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-1)',
      marginBottom: '0.625rem', marginTop: '2rem',
      paddingTop: '1rem',
    }}>
      {children}
    </h2>
  )
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-1)',
      marginBottom: '0.5rem', marginTop: '1.25rem',
    }}>
      {children}
    </h3>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-2)',
      marginBottom: '0.75rem',
    }}>
      {children}
    </p>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return <code className="code-inline">{children}</code>
}

export default function GuidePage() {
  const { slug } = useOrgStore()
  const [active, setActive] = useState('overview')

  function scrollTo(id: string) {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const orgSlug = slug || '{your-slug}'

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--bg)' }}>
      {/* TOC sidebar */}
      <aside style={{
        width: 210, flexShrink: 0,
        borderRight: '1px solid var(--border)',
        background: 'var(--surface)',
        position: 'sticky', top: 0, height: '100vh',
        overflowY: 'auto',
        padding: '1.25rem 0.625rem',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0 0.5rem', marginBottom: '1rem',
        }}>
          <BookOpen size={13} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-1)' }}>
            Integration Guide
          </span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.4rem 0.5rem', borderRadius: '0.375rem',
                fontSize: '0.78rem', cursor: 'pointer',
                fontFamily: 'inherit', textAlign: 'left',
                background: active === s.id ? 'var(--surface-2)' : 'transparent',
                color: active === s.id ? 'var(--text-1)' : 'var(--text-3)',
                border: 'none',
                fontWeight: active === s.id ? 500 : 400,
                transition: 'all 0.15s',
              }}
            >
              {active === s.id
                ? <ChevronRight size={9} style={{ flexShrink: 0, color: 'var(--accent)' }} />
                : <span style={{ width: 9, flexShrink: 0 }} />}
              {s.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem 4rem', maxWidth: 760 }}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Overview */}
          <div id="overview">
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.3rem 0.75rem',
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '9999px', marginBottom: '1rem',
              fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              Integration Guide
            </div>
            <h1 style={{
              fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-1)',
              marginBottom: '0.75rem', lineHeight: 1.25,
            }}>
              Onboard your app to Vault SSO
            </h1>
            <P>
              Vault SSO is a multi-tenant OAuth2 Authorization Server built on Spring Security. It issues
              RS256-signed JWTs with org context, RBAC roles, and fine-grained permissions baked into every token.
              This guide walks you through going from zero to a working OAuth2 integration in under 15 minutes.
            </P>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', margin: '1.25rem 0' }}>
              {[
                { label: 'Auth flow', value: 'Authorization Code' },
                { label: 'Token format', value: 'JWT / RS256' },
                { label: 'Multi-tenancy', value: 'Org slug in issuer' },
              ].map(i => (
                <div key={i.label} className="card" style={{
                  padding: '0.875rem',
                  background: 'var(--surface)',
                }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '0.25rem' }}>{i.label}</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-1)' }}>{i.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step 1 */}
          <div id="step1">
            <SectionTitle>1. Create an Organization</SectionTitle>
            <P>
              Every app lives inside an organization. If you already signed up, your org exists — grab its slug
              from the sidebar. If not, go to <Pill>/signup</Pill> and create one now.
            </P>
            <CodeBlock lang="http" code={`POST http://localhost:9000/api/signup
Content-Type: application/json

{
  "orgName": "Acme Corp",
  "slug": "acme-corp",
  "adminEmail": "admin@acme.com",
  "adminPassword": "s3cr3tPass!"
}`} />
          </div>

          {/* Step 2 */}
          <div id="step2">
            <SectionTitle>2. Register Your Application</SectionTitle>
            <P>
              Go to <strong style={{ color: 'var(--text-1)' }}>Applications → Register App</strong> in the
              dashboard, or call the API. You'll receive a <Pill>clientId</Pill> and <Pill>clientSecret</Pill> —
              the secret is shown only once.
            </P>
            <CodeBlock lang="http" code={`POST http://localhost:9000/api/orgs/${orgSlug}/clients
Content-Type: application/json
Authorization: <session cookie>

{
  "clientName": "My App",
  "redirectUris": ["https://myapp.com/callback"],
  "scopes": ["openid", "profile", "email"],
  "grantTypes": ["authorization_code", "refresh_token"]
}`} />
            <CodeBlock lang="json" code={`{
  "clientId": "550e8400-e29b-41d4-a716-446655440000",
  "clientSecret": "raw-secret-shown-once",
  "clientName": "My App"
}`} />
            <div style={{
              padding: '0.875rem 1rem',
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '0.5rem', margin: '0.875rem 0',
            }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fbbf24', marginBottom: '0.25rem' }}>
                Store the client secret securely
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                The plaintext secret is returned only on registration. It is BCrypt-hashed in the database
                immediately after. Store it in an environment variable or secrets manager.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div id="step3">
            <SectionTitle>3. Implement the Authorization Code Flow</SectionTitle>
            <P>
              Vault SSO uses the standard OAuth2 Authorization Code flow. All endpoints are scoped under your
              org slug — replace <Pill>{'{slug}'}</Pill> with your actual slug.
            </P>

            <SubTitle>Step 3a — Redirect the user to the authorization endpoint</SubTitle>
            <CodeBlock lang="url" code={`http://localhost:9000/${orgSlug}/oauth2/authorize
  ?response_type=code
  &client_id={your-client-id}
  &redirect_uri=https://myapp.com/callback
  &scope=openid+profile+email
  &state={random-csrf-token}`} />

            <SubTitle>Step 3b — Exchange the code for tokens</SubTitle>
            <P>The SSO redirects to your <Pill>redirect_uri</Pill> with a <Pill>code</Pill>. Exchange it immediately (codes expire in 5 minutes).</P>
            <CodeBlock lang="http" code={`POST http://localhost:9000/${orgSlug}/oauth2/token
Authorization: Basic {base64(clientId:clientSecret)}
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code={auth-code-from-callback}
&redirect_uri=https://myapp.com/callback`} />
            <CodeBlock lang="json" code={`{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 3600
}`} />

            <SubTitle>Step 3c — Refresh the access token</SubTitle>
            <CodeBlock lang="http" code={`POST http://localhost:9000/${orgSlug}/oauth2/token
Authorization: Basic {base64(clientId:clientSecret)}
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token={your-refresh-token}`} />
          </div>

          {/* Step 4 */}
          <div id="step4">
            <SectionTitle>4. Validate the JWT in Your Backend</SectionTitle>
            <P>
              JWTs are RS256-signed. Validate using the JWKS endpoint — never hardcode the public key.
            </P>

            <SubTitle>JWKS endpoint</SubTitle>
            <CodeBlock lang="url" code={`http://localhost:9000/oauth2/jwks`} />

            <SubTitle>Spring Boot Resource Server</SubTitle>
            <CodeBlock lang="yaml" code={`spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          jwk-set-uri: http://localhost:9000/oauth2/jwks`} />

            <SubTitle>Node.js (jose)</SubTitle>
            <CodeBlock lang="javascript" code={`import { createRemoteJWKSet, jwtVerify } from 'jose'

const JWKS = createRemoteJWKSet(
  new URL('http://localhost:9000/oauth2/jwks')
)

async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Missing token' })
  try {
    const { payload } = await jwtVerify(token, JWKS, { algorithms: ['RS256'] })
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}`} />
          </div>

          {/* Step 5 */}
          <div id="step5">
            <SectionTitle>5. Use JWT Claims for Authorization</SectionTitle>
            <P>
              Every JWT contains org context, roles, and permissions. Use these for access control without extra DB lookups.
            </P>
            <CodeBlock lang="java" code={`@GetMapping("/api/me")
public ResponseEntity<?> me(JwtAuthenticationToken auth) {
    Jwt jwt = auth.getToken();
    String orgId    = jwt.getClaimAsString("org_id");
    String orgRole  = jwt.getClaimAsString("org_role");
    List<String> roles       = jwt.getClaimAsStringList("roles");
    List<String> permissions = jwt.getClaimAsStringList("permissions");
    return ResponseEntity.ok(Map.of("orgId", orgId, "roles", roles));
}`} />
            <CodeBlock lang="java" code={`// Role-based guards
@PreAuthorize("hasRole('ORG_ADMIN')")
public void adminOnly() { ... }

// Permission-based guards
@PreAuthorize("hasAuthority('PERMISSION_post:publish')")
public void publishPost() { ... }`} />
          </div>

          {/* Claims Reference */}
          <div id="claims">
            <SectionTitle>JWT Claims Reference</SectionTitle>
            <P>Every access token issued by Vault SSO includes these claims:</P>
            <div className="card" style={{ overflow: 'hidden', background: 'var(--surface)' }}>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Claim</th>
                      <th>Type</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['sub', 'string', 'User ID (UUID)'],
                      ['iss', 'string', `Issuer URI — http://localhost:9000/{org-slug}`],
                      ['aud', 'string[]', 'Audience — contains your client_id'],
                      ['exp', 'number', 'Expiry timestamp (Unix) — 1 hour default'],
                      ['email', 'string', 'User email address'],
                      ['org_id', 'string', 'Organization UUID — use to scope DB queries'],
                      ['org_slug', 'string', 'Organization slug — human-readable tenant ID'],
                      ['org_role', 'string', 'Org-level role: ORG_ADMIN or ORG_MEMBER'],
                      ['roles', 'string[]', 'App-specific roles for your client'],
                      ['permissions', 'string[]', 'Flattened permissions from all assigned roles'],
                    ].map(([claim, type, desc]) => (
                      <tr key={claim}>
                        <td><code className="code-inline">{claim}</code></td>
                        <td><code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: 'var(--text-3)' }}>{type}</code></td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Endpoint Reference */}
          <div id="endpoints" style={{ paddingBottom: '2rem' }}>
            <SectionTitle>Endpoint Reference</SectionTitle>
            <P>All OAuth2 endpoints are tenant-scoped. Replace <Pill>{'{slug}'}</Pill> with your org slug.</P>
            <div className="card" style={{ overflow: 'hidden', background: 'var(--surface)' }}>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 56 }}>Method</th>
                      <th>Path</th>
                      <th>Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['GET',  '/{slug}/oauth2/authorize', 'Start authorization flow'],
                      ['POST', '/{slug}/oauth2/token', 'Exchange code / refresh token'],
                      ['GET',  '/{slug}/oauth2/userinfo', 'OIDC UserInfo endpoint'],
                      ['GET',  '/oauth2/jwks', 'Public key set for JWT validation'],
                      ['POST', '/api/signup', 'Create org + admin in one step'],
                      ['GET',  '/api/orgs/{slug}', 'Get organization details'],
                      ['POST', '/api/orgs/{slug}/clients', 'Register an OAuth2 app'],
                      ['GET',  '/api/orgs/{slug}/clients', 'List registered apps'],
                      ['POST', '/api/orgs/{slug}/users', 'Create a user'],
                      ['GET',  '/api/orgs/{slug}/users', 'List users'],
                      ['POST', '/api/orgs/{slug}/roles', 'Create a role'],
                      ['POST', '/api/orgs/{slug}/permissions', 'Create a permission'],
                      ['POST', '/api/orgs/{slug}/roles/{roleId}/permissions/{permId}', 'Assign permission to role'],
                    ].map(([method, path, desc]) => (
                      <tr key={path}>
                        <td>
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                            color: method === 'GET' ? 'var(--success)' : method === 'DELETE' ? 'var(--error)' : 'var(--accent)',
                          }}>{method}</span>
                        </td>
                        <td>
                          <code style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '0.75rem', color: 'var(--text-2)',
                          }}>{path}</code>
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </motion.div>
      </main>
    </div>
  )
}
