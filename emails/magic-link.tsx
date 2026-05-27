import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "react-email";

interface MagicLinkEmailProps {
  url: string;
  host: string;
  iconUrl: string;
}

const main = {
  backgroundColor: "#F9FAFB",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: 0,
};

const container = {
  margin: "0 auto",
  padding: "32px 0",
  maxWidth: "560px",
};

const card = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "8px",
  padding: "40px 32px",
};

const iconStyle = {
  margin: "0 0 24px 0",
  borderRadius: "8px",
};

const heading = {
  fontSize: "22px",
  fontWeight: 600,
  color: "#111827",
  margin: "0 0 16px 0",
  letterSpacing: "-0.01em",
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#4B5563",
  margin: "0 0 24px 0",
};

const button = {
  backgroundColor: "#1A56DB",
  color: "#FFFFFF",
  fontSize: "15px",
  fontWeight: 600,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
  borderRadius: "6px",
};

const fallbackLabel = {
  fontSize: "13px",
  color: "#6B7280",
  margin: "32px 0 8px 0",
};

const fallbackUrl = {
  fontSize: "13px",
  color: "#1A56DB",
  wordBreak: "break-all" as const,
  margin: "0 0 24px 0",
};

const expiry = {
  fontSize: "13px",
  color: "#6B7280",
  margin: "0",
};

const divider = {
  borderColor: "#E5E7EB",
  margin: "32px 0",
};

const footer = {
  fontSize: "12px",
  lineHeight: "20px",
  color: "#9CA3AF",
  margin: "0 0 8px 0",
};

export default function MagicLinkEmail({
  url,
  host,
  iconUrl,
}: MagicLinkEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Your sign-in link for NextOpp</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={card}>
            <Img
              src={iconUrl}
              width="48"
              height="48"
              alt="NextOpp"
              style={iconStyle}
            />
            <Text style={heading}>Sign in to NextOpp</Text>
            <Text style={paragraph}>
              Click the button below to sign in to your account. This link will
              only work once.
            </Text>
            <Button href={url} style={button}>
              Sign in to NextOpp
            </Button>
            <Text style={fallbackLabel}>
              Or paste this URL into your browser:
            </Text>
            <Link href={url} style={fallbackUrl}>
              {url}
            </Link>
            <Text style={expiry}>This link expires in 30 minutes.</Text>
            <Hr style={divider} />
            <Text style={footer}>
              If you didn&apos;t request this email, you can safely ignore it.
              NextOpp will never ask for this link by phone, chat, or email.
            </Text>
            <Text style={footer}>Sent by {host}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

MagicLinkEmail.PreviewProps = {
  url: "http://localhost:3000/api/auth/callback/resend?token=abc123&email=you%40example.com",
  host: "localhost:3000",
  iconUrl: "http://localhost:3000/email/icon.png",
} satisfies MagicLinkEmailProps;

export { MagicLinkEmail };
