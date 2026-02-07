/**
 * Centralized request utilities for IP extraction and validation.
 */

const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_REGEX = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

/**
 * Validates that a string is a valid IPv4 or IPv6 address.
 */
function isValidIp(ip: string): boolean {
    return IPV4_REGEX.test(ip) || IPV6_REGEX.test(ip);
}

/**
 * Extracts the client IP from a request, with anti-spoofing validation.
 *
 * - Reads from x-forwarded-for header (first entry, trimmed)
 * - Validates the IP format (IPv4/IPv6)
 * - Falls back to '0.0.0.0' if invalid (shares rate limit with other spoofers)
 */
export function getIp(request: Request): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        const ip = forwardedFor.split(',')[0].trim();
        if (ip && isValidIp(ip)) {
            return ip;
        }
        // Invalid IP format — possible spoofing attempt
        return '0.0.0.0';
    }
    return '127.0.0.1';
}
