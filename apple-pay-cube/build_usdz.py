#!/usr/bin/env python3
"""
Build a USDZ file from a USDA source.
USDZ = uncompressed ZIP archive with 64-byte alignment.
"""

import struct
import os

def create_usdz(usda_path, output_path):
    """Create a USDZ file (uncompressed ZIP with 64-byte alignment)."""

    with open(usda_path, 'rb') as f:
        usda_data = f.read()

    filename = os.path.basename(usda_path)
    filename_bytes = filename.encode('utf-8')

    # USDZ requires 64-byte alignment for file data
    ALIGNMENT = 64

    with open(output_path, 'wb') as out:
        # --- Local File Header ---
        local_header_fixed_size = 30  # fixed part of local file header
        header_start = 0

        # Calculate where data starts and add padding for alignment
        data_offset_unpadded = local_header_fixed_size + len(filename_bytes)
        padding_needed = (ALIGNMENT - (data_offset_unpadded % ALIGNMENT)) % ALIGNMENT
        extra_field = b'\x00' * padding_needed

        # Local file header
        out.write(struct.pack('<I', 0x04034b50))       # Local file header signature
        out.write(struct.pack('<H', 20))                 # Version needed to extract (2.0)
        out.write(struct.pack('<H', 0))                  # General purpose bit flag
        out.write(struct.pack('<H', 0))                  # Compression method (0 = stored)
        out.write(struct.pack('<H', 0))                  # Last mod file time
        out.write(struct.pack('<H', 0))                  # Last mod file date

        # CRC-32
        import binascii
        crc = binascii.crc32(usda_data) & 0xFFFFFFFF
        out.write(struct.pack('<I', crc))

        out.write(struct.pack('<I', len(usda_data)))     # Compressed size
        out.write(struct.pack('<I', len(usda_data)))     # Uncompressed size
        out.write(struct.pack('<H', len(filename_bytes))) # File name length
        out.write(struct.pack('<H', len(extra_field)))   # Extra field length
        out.write(filename_bytes)                         # File name
        out.write(extra_field)                            # Extra field (padding)

        # File data
        data_start = out.tell()
        assert data_start % ALIGNMENT == 0, f"Data not aligned: offset {data_start}"
        out.write(usda_data)

        # --- Central Directory ---
        cd_start = out.tell()

        out.write(struct.pack('<I', 0x02014b50))         # Central directory file header signature
        out.write(struct.pack('<H', 20))                  # Version made by
        out.write(struct.pack('<H', 20))                  # Version needed to extract
        out.write(struct.pack('<H', 0))                   # General purpose bit flag
        out.write(struct.pack('<H', 0))                   # Compression method (stored)
        out.write(struct.pack('<H', 0))                   # Last mod file time
        out.write(struct.pack('<H', 0))                   # Last mod file date
        out.write(struct.pack('<I', crc))                 # CRC-32
        out.write(struct.pack('<I', len(usda_data)))      # Compressed size
        out.write(struct.pack('<I', len(usda_data)))      # Uncompressed size
        out.write(struct.pack('<H', len(filename_bytes))) # File name length
        out.write(struct.pack('<H', 0))                   # Extra field length
        out.write(struct.pack('<H', 0))                   # File comment length
        out.write(struct.pack('<H', 0))                   # Disk number start
        out.write(struct.pack('<H', 0))                   # Internal file attributes
        out.write(struct.pack('<I', 0))                   # External file attributes
        out.write(struct.pack('<I', header_start))        # Relative offset of local header
        out.write(filename_bytes)                          # File name

        cd_end = out.tell()
        cd_size = cd_end - cd_start

        # --- End of Central Directory Record ---
        out.write(struct.pack('<I', 0x06054b50))          # EOCD signature
        out.write(struct.pack('<H', 0))                   # Number of this disk
        out.write(struct.pack('<H', 0))                   # Disk where CD starts
        out.write(struct.pack('<H', 1))                   # Number of CD records on this disk
        out.write(struct.pack('<H', 1))                   # Total number of CD records
        out.write(struct.pack('<I', cd_size))             # Size of central directory
        out.write(struct.pack('<I', cd_start))            # Offset of start of CD
        out.write(struct.pack('<H', 0))                   # Comment length

    file_size = os.path.getsize(output_path)
    print(f"✅ Created: {output_path} ({file_size} bytes)")
    print(f"   Source: {usda_path}")
    print(f"   Data alignment: {ALIGNMENT} bytes")


if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    usda_file = os.path.join(script_dir, 'cube_configurator.usda')
    usdz_file = os.path.join(script_dir, 'cube_configurator.usdz')

    create_usdz(usda_file, usdz_file)
