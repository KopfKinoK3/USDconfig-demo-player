#!/usr/bin/env python3
"""
Build a USDZ file from a USDA source.
USDZ = uncompressed ZIP archive with 64-byte alignment.
"""

import struct
import os
import binascii

def create_usdz(usda_path, output_path):
    """Create a USDZ file (uncompressed ZIP with 64-byte alignment)."""
    with open(usda_path, 'rb') as f:
        usda_data = f.read()

    filename = os.path.basename(usda_path)
    filename_bytes = filename.encode('utf-8')
    ALIGNMENT = 64

    with open(output_path, 'wb') as out:
        header_start = 0
        local_header_fixed_size = 30
        data_offset_unpadded = local_header_fixed_size + len(filename_bytes)
        padding_needed = (ALIGNMENT - (data_offset_unpadded % ALIGNMENT)) % ALIGNMENT
        extra_field = b'\x00' * padding_needed

        out.write(struct.pack('<I', 0x04034b50))
        out.write(struct.pack('<H', 20))
        out.write(struct.pack('<H', 0))
        out.write(struct.pack('<H', 0))
        out.write(struct.pack('<H', 0))
        out.write(struct.pack('<H', 0))

        crc = binascii.crc32(usda_data) & 0xFFFFFFFF
        out.write(struct.pack('<I', crc))
        out.write(struct.pack('<I', len(usda_data)))
        out.write(struct.pack('<I', len(usda_data)))
        out.write(struct.pack('<H', len(filename_bytes)))
        out.write(struct.pack('<H', len(extra_field)))
        out.write(filename_bytes)
        out.write(extra_field)

        data_start = out.tell()
        assert data_start % ALIGNMENT == 0, f"Data not aligned: offset {data_start}"
        out.write(usda_data)

        cd_start = out.tell()
        out.write(struct.pack('<I', 0x02014b50))
        out.write(struct.pack('<H', 20))
        out.write(struct.pack('<H', 20))
        out.write(struct.pack('<H', 0))
        out.write(struct.pack('<H', 0))
        out.write(struct.pack('<H', 0))
        out.write(struct.pack('<H', 0))
        out.write(struct.pack('<I', crc))
        out.write(struct.pack('<I', len(usda_data)))
        out.write(struct.pack('<I', len(usda_data)))
        out.write(struct.pack('<H', len(filename_bytes)))
        out.write(struct.pack('<H', 0))
        out.write(struct.pack('<H', 0))
        out.write(struct.pack('<H', 0))
        out.write(struct.pack('<H', 0))
        out.write(struct.pack('<I', 0))
        out.write(struct.pack('<I', header_start))
        out.write(filename_bytes)

        cd_end = out.tell()
        cd_size = cd_end - cd_start

        out.write(struct.pack('<I', 0x06054b50))
        out.write(struct.pack('<H', 0))
        out.write(struct.pack('<H', 0))
        out.write(struct.pack('<H', 1))
        out.write(struct.pack('<H', 1))
        out.write(struct.pack('<I', cd_size))
        out.write(struct.pack('<I', cd_start))
        out.write(struct.pack('<H', 0))

    file_size = os.path.getsize(output_path)
    print(f"Created: {output_path} ({file_size} bytes)")

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    usda_file = os.path.join(script_dir, 'cube_configurator.usda')
    usdz_file = os.path.join(script_dir, 'cube_configurator.usdz')
    create_usdz(usda_file, usdz_file)
