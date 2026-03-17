# Slide Viewer

A lightweight web-based slide viewer for displaying presentations in your browser.

## Features

- **Navigation Controls**: Use Previous/Next buttons or arrow keys to navigate
- **Slide Counter**: Display current slide number and total slides
- **Responsive Design**: Works on desktop and mobile devices
- **File Upload**: Upload presentation files to display slides
- **Keyboard Navigation**: Use arrow keys for quick navigation

## Getting Started

### Prerequisites

- Node.js and npm installed
- A modern web browser

### Installation

1. Navigate to the project directory:
```bash
cd slide-viewer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:8080
```

## Usage

### Viewing Default Slides

The application comes with 3 sample slides. Use the navigation buttons or arrow keys to browse them.

### Uploading Presentations

1. Click on "Upload Presentation" section
2. Select a file (.pptx, .ppt, .odp, or .pdf)

**Note**: To display actual PowerPoint or PDF files, you'll need to either:
- Convert presentations to images/PDFs and host them
- Integrate a library like `pptxjs`, `reveal.js`, or `pdf.js`

## Keyboard Shortcuts

- **→ (Right Arrow)**: Next slide
- **← (Left Arrow)**: Previous slide

## Customization

You can modify the sample slides by editing the `slides` array in `script.js`:

```javascript
let slides = [
    {
        title: "Your Title",
        content: "Your content here"
    },
    // Add more slides...
];
```

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript

## Future Enhancements

- PowerPoint file parsing with pptxjs
- PDF viewer integration
- Theme/color customization
- Full-screen mode
- Presentation timer
- Speaker notes

## License

MIT
