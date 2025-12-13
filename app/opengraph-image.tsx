import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Banco de Ideas';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: '#F8F5F0',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '300px',
                        height: '300px',
                        borderRadius: '150px',
                        background: 'white',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                    }}
                >
                    {/* Simple SVG Lightbulb representation for OG Image */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="150"
                        height="150"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#C5A47C"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path d="M9 18h6"></path>
                        <path d="M10 22h4"></path>
                        <path d="M15.09 14c.18-.9.66-1.74 1.41-2.5A4.65 4.65 0 0 0 12 3.5a4.65 4.65 0 0 0-4.5 7.97c.75.76 1.23 1.6 1.41 2.5"></path>
                    </svg>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
