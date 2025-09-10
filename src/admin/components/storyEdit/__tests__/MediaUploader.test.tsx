// src/admin/components/storyEdit/__tests__/MediaUploader.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MediaUploader } from '../MediaUploader';

// Mock fetch
global.fetch = (global as any).jest?.fn() || (() => {});

// Mock file creation
const createMockFile = (name: string, type: string, content: string = 'test content') => {
  const file = new File([content], name, { type });
  return file;
};

describe('MediaUploader Component', () => {
  const mockOnUpdate = (global as any).jest?.fn() || (() => {});
  const defaultProps = {
    items: [],
    onUpdate: mockOnUpdate,
    placeholder: 'https://example.com/test.jpg',
    label: 'Test Media',
    acceptedFileTypes: '.jpg,.jpeg,.png',
    mediaType: 'image' as const,
  };

  beforeEach(() => {
    if ((global as any).jest) {
      (global as any).jest.clearAllMocks();
      (fetch as any).mockClear();
    }
  });

  describe('URL Input Mode', () => {
    it('should render URL input mode by default', () => {
      render(<MediaUploader {...defaultProps} />);
      
      expect(screen.getByText('🔗 Add Link')).toBeInTheDocument();
      expect(screen.getByText('📁 Upload File')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('https://example.com/test.jpg')).toBeInTheDocument();
    });

    it('should add URL when Add button is clicked', async () => {
      const user = userEvent.setup();
      render(<MediaUploader {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('https://example.com/test.jpg');
      const addButton = screen.getByText('➕ Add');
      
      await user.type(input, 'https://example.com/test-image.jpg');
      await user.click(addButton);
      
      expect(mockOnUpdate).toHaveBeenCalledWith(['https://example.com/test-image.jpg']);
    });

    it('should add URL when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(<MediaUploader {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('https://example.com/test.jpg');
      
      await user.type(input, 'https://example.com/test-image.jpg');
      await user.keyboard('{Enter}');
      
      expect(mockOnUpdate).toHaveBeenCalledWith(['https://example.com/test-image.jpg']);
    });

    it('should not add empty URL', async () => {
      const user = userEvent.setup();
      render(<MediaUploader {...defaultProps} />);
      
      const addButton = screen.getByText('➕ Add');
      await user.click(addButton);
      
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });

  describe('File Upload Mode', () => {
    it('should switch to upload mode when Upload File button is clicked', async () => {
      const user = userEvent.setup();
      render(<MediaUploader {...defaultProps} />);
      
      const uploadButton = screen.getByText('📁 Upload File');
      await user.click(uploadButton);
      
      expect(screen.getByText('Drag & drop file here')).toBeInTheDocument();
      expect(screen.getByText('📁 Choose File to Upload')).toBeInTheDocument();
    });

    it('should handle file picker click', async () => {
      const user = userEvent.setup();
      render(<MediaUploader {...defaultProps} />);
      
      // Switch to upload mode
      const uploadButton = screen.getByText('📁 Upload File');
      await user.click(uploadButton);
      
      // Mock file input click
      const fileInput = screen.getByRole('button', { name: /choose file to upload/i });
      await user.click(fileInput);
      
      // The actual file picker opening can't be tested in JSDOM
      // but we can verify the button is clickable
      expect(fileInput).toBeInTheDocument();
    });

    it('should handle successful file upload', async () => {
      const user = userEvent.setup();
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          url: '/uploads/media/test_20250910_abc123.jpg',
          filename: 'test_20250910_abc123.jpg',
          category: 'image',
          size: 1024,
          mimetype: 'image/jpeg'
        })
      });

      render(<MediaUploader {...defaultProps} />);
      
      // Switch to upload mode
      const uploadButton = screen.getByText('📁 Upload File');
      await user.click(uploadButton);
      
      // Create mock file
      const file = createMockFile('test.jpg', 'image/jpeg');
      
      // Simulate file input change
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/upload/media', {
          method: 'POST',
          body: expect.any(FormData),
          credentials: 'include',
        });
      });
      
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(['/uploads/media/test_20250910_abc123.jpg']);
      });
    });

    it('should handle file upload error', async () => {
      const user = userEvent.setup();
      (fetch as any).mockRejectedValueOnce(new Error('Upload failed'));

      // Mock alert
      const alertSpy = (global as any).jest?.spyOn(window, 'alert')?.mockImplementation(() => {}) || { mockRestore: () => {} };

      render(<MediaUploader {...defaultProps} />);
      
      // Switch to upload mode
      const uploadButton = screen.getByText('📁 Upload File');
      await user.click(uploadButton);
      
      // Create mock file
      const file = createMockFile('test.jpg', 'image/jpeg');
      
      // Simulate file input change
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Upload failed: Upload failed');
      });
      
      alertSpy.mockRestore();
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag over event', async () => {
      const user = userEvent.setup();
      render(<MediaUploader {...defaultProps} />);
      
      // Switch to upload mode
      const uploadButton = screen.getByText('📁 Upload File');
      await user.click(uploadButton);
      
      const dropArea = screen.getByText('Drag & drop file here').closest('div');
      
      fireEvent.dragOver(dropArea!);
      
      expect(screen.getByText('Drop file here to upload')).toBeInTheDocument();
    });

    it('should handle drag leave event', async () => {
      const user = userEvent.setup();
      render(<MediaUploader {...defaultProps} />);
      
      // Switch to upload mode
      const uploadButton = screen.getByText('📁 Upload File');
      await user.click(uploadButton);
      
      const dropArea = screen.getByText('Drag & drop file here').closest('div');
      
      fireEvent.dragOver(dropArea!);
      fireEvent.dragLeave(dropArea!);
      
      expect(screen.getByText('Drag & drop file here')).toBeInTheDocument();
    });

    it('should handle file drop', async () => {
      const user = userEvent.setup();
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          url: '/uploads/media/dropped_20250910_abc123.jpg',
          filename: 'dropped_20250910_abc123.jpg',
          category: 'image',
          size: 1024,
          mimetype: 'image/jpeg'
        })
      });

      render(<MediaUploader {...defaultProps} />);
      
      // Switch to upload mode
      const uploadButton = screen.getByText('📁 Upload File');
      await user.click(uploadButton);
      
      const dropArea = screen.getByText('Drag & drop file here').closest('div');
      
      // Create mock file
      const file = createMockFile('dropped.jpg', 'image/jpeg');
      
      // Simulate drop event
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [file]
        }
      });
      
      fireEvent(dropArea!, dropEvent);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/upload/media', {
          method: 'POST',
          body: expect.any(FormData),
          credentials: 'include',
        });
      });
    });
  });

  describe('Media Items Display', () => {
    it('should display existing media items', () => {
      const propsWithItems = {
        ...defaultProps,
        items: [
          'https://example.com/image1.jpg',
          'https://example.com/video1.mp4'
        ]
      };
      
      render(<MediaUploader {...propsWithItems} />);
      
      expect(screen.getByText('https://example.com/image1.jpg')).toBeInTheDocument();
      expect(screen.getByText('https://example.com/video1.mp4')).toBeInTheDocument();
    });

    it('should remove media item when remove button is clicked', async () => {
      const user = userEvent.setup();
      const propsWithItems = {
        ...defaultProps,
        items: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg'
        ]
      };
      
      render(<MediaUploader {...propsWithItems} />);
      
      const removeButtons = screen.getAllByText('❌ Remove');
      await user.click(removeButtons[0]);
      
      expect(mockOnUpdate).toHaveBeenCalledWith(['https://example.com/image2.jpg']);
    });

    it('should display image preview for image URLs', () => {
      const propsWithItems = {
        ...defaultProps,
        items: ['https://example.com/image1.jpg']
      };
      
      render(<MediaUploader {...propsWithItems} />);
      
      const image = screen.getByAltText('Media preview');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image1.jpg');
    });

    it('should display video player for video URLs', () => {
      const propsWithItems = {
        ...defaultProps,
        items: ['https://example.com/video1.mp4']
      };
      
      render(<MediaUploader {...propsWithItems} />);
      
      const video = screen.getByRole('application');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', 'https://example.com/video1.mp4');
    });

    it('should display audio player for audio URLs', () => {
      const propsWithItems = {
        ...defaultProps,
        items: ['https://example.com/audio1.mp3']
      };
      
      render(<MediaUploader {...propsWithItems} />);
      
      const audio = screen.getByRole('application');
      expect(audio).toBeInTheDocument();
      expect(audio).toHaveAttribute('src', 'https://example.com/audio1.mp3');
    });

    it('should display YouTube embed for YouTube URLs', () => {
      const propsWithItems = {
        ...defaultProps,
        items: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ']
      };
      
      render(<MediaUploader {...propsWithItems} />);
      
      const iframe = screen.getByTitle('YouTube video player');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ');
    });
  });

  describe('Loading States', () => {
    it('should show loading state during upload', async () => {
      const user = userEvent.setup();
      (fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<MediaUploader {...defaultProps} />);
      
      // Switch to upload mode
      const uploadButton = screen.getByText('📁 Upload File');
      await user.click(uploadButton);
      
      // Create mock file
      const file = createMockFile('test.jpg', 'image/jpeg');
      
      // Simulate file input change
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      expect(screen.getByText('⏳ Uploading...')).toBeInTheDocument();
    });
  });
});
