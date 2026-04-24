# Disk Images, Partitioning, Recovery, and Bootable Media (Windows-first)

This guide is opinionated and biased toward **repeatable, low-risk workflows**:
- **Image first**, especially if the disk might be failing.
- **Do not “repair” the original drive** until you have a verified image.
- Prefer **bootable live media** for partition edits (reduces “OS is using the disk” risk).

## Table of contents

- [Safety rules (read first)](#safety-rules-read-first)
- [Pick the right tool by job](#pick-the-right-tool-by-job)
- [Decision tree (fast)](#decision-tree-fast)
- [Common workflows](#common-workflows)
- [Ventoy + multi-OS “ark drive” design](#ventoy--multi-os-ark-drive-design)
- [GPT vs MBR (practical)](#gpt-vs-mbr-practical)
- [Links](#links)

## Safety rules (read first)

1. If the disk is clicking, extremely slow, or throwing I/O errors: **treat it as failing**.
2. Don’t run filesystem repair tools first (they write to disk). **Image first.**
3. Do recovery work on the **image**, not the original disk.
4. If data is priceless and you’re unsure, stop and use a professional recovery service.

## Pick the right tool by job

| Job | Best default | Why |
|---|---|---|
| Resize/move/create partitions | **GParted (live USB)** | Purpose-built partition editor; reduces “in-use Windows volume” risk. |
| Full-disk imaging / bare-metal restore | **Clonezilla** | Proven imaging/cloning standard; great for exact restores/deployments. |
| Imaging with friendlier UI | **Rescuezilla** | GUI imaging workflow; good for humans. |
| Windows backup discipline (ongoing) | **Macrium Reflect** | Strong Windows-first imaging + restore UX for periodic backups. |
| Windows “Swiss army knife” | **DiskGenius** | Partitioning + cloning + recovery + utilities in one GUI. |
| Failing drive imaging | **SystemRescue + GNU ddrescue** | ddrescue is designed for bad blocks; prioritize salvage imaging. |
| Lost partitions / deleted files (free) | **TestDisk / PhotoRec** | Solid open-source recovery baseline. |
| Deep/pro recovery | **R-Studio** | Strong when the situation is messy and recovery is the mission. |
| Multi-boot USB (images as files) | **Ventoy** | Store images as normal files; easy to update over time. |

Notes:
- “Best” depends on whether your priority is **data recovery**, **OS migration**, or **repeatability**.
- Avoid locking into one magic tool. Use the right tool for the job.

## Decision tree (fast)

### A) Does the drive show signs of failure?

- Yes / maybe → **SystemRescue + ddrescue** to make an image, then recover from the image using TestDisk/R-Studio/DiskGenius.
- No → Continue.

### B) Are you changing partitions?

- Yes → Prefer **GParted live USB**.
- No → Continue.

### C) Are you making a full image or migrating Windows?

- One-time clone/migrate → **Macrium Reflect** or **DiskGenius** (Windows-first) or **Clonezilla** (tech-first).
- Ongoing backups → **Macrium Reflect** (or org-approved backup tooling).

### D) Are you building a bootable “toolkit drive” for many OS images?

- Yes → **Ventoy** (GPT + exFAT main partition + optional reserved space).

## Common workflows

### 1) “My drive might be failing”

1. Boot **SystemRescue** (live USB).
2. Use **ddrescue** to create a rescue image to a *different* healthy disk.
3. Work on the image:
   - **TestDisk** for partition table recovery
   - **PhotoRec** for file carving
   - **R-Studio** / **DiskGenius** for deeper recovery workflows

### 2) “I need to resize partitions safely”

1. Make an image first (even if the drive is healthy).
2. Boot **GParted** live USB.
3. Resize/move partitions and apply.

### 3) “I need a clean, repeatable full-disk image”

- **Clonezilla**: best for exact clones/restore/deploy (more technical).
- **Rescuezilla**: best when you want a GUI and fewer footguns.

### 4) “I need to migrate Windows to a new SSD”

- Prefer **Macrium Reflect** for a disciplined Windows-first path.
- Use **DiskGenius** when you want “everything in one GUI” and accept the tradeoffs.

## Ventoy + multi-OS “ark drive” design

A `.vhdx` is great for **Windows, Hyper-V, and WSL2**. But Ventoy’s “universal layer” is not the VHDX.

Ventoy’s model:
- One physical partition the OS can read (usually **exFAT**)
- Images stored as normal files: `*.iso`, `*.vhdx`, `*.img`, `*.wim`, etc.
- A small EFI partition managed by Ventoy

Recommended conceptual layout:

```text
Ventoy GPT disk
├─ exFAT universal data partition
│  ├─ boot/         (*.iso, *.wim, tools)
│  ├─ images/       (*.vhdx, *.img, *.qcow2)
│  └─ shared/
├─ VTOYEFI (FAT) boot partition
└─ optional native partitions (only if needed)
   ├─ ext4
   ├─ APFS/HFS+
   └─ FAT32
```

Practical partition plan (example):

```text
Disk: 2 TB external SSD
Partition table: GPT

Part 1 — VentoyMain (exFAT)  ~1.4 TB
  - ISO/VHDX/IMG/WIM + shared files

Part 2 — VTOYEFI (FAT)       32 MB
  - Ventoy boot files (do not modify)

Part 3 — Reserved/Native     optional
  - ext4/APFS/HFS+ only if you truly need native partitions
```

## GPT vs MBR (practical)

For Windows 11 + UEFI machines, default to **GPT** unless you explicitly need legacy BIOS support.

## Links

- DiskGenius: https://www.diskgenius.com/
- GParted: https://gparted.org/
- Clonezilla: https://clonezilla.org/
- Rescuezilla: https://rescuezilla.com/
- Macrium Reflect: https://www.macrium.com/
- SystemRescue: https://www.system-rescue.org/
- GNU ddrescue: https://www.gnu.org/software/ddrescue/
- TestDisk / PhotoRec: https://www.cgsecurity.org/
- R-Studio: https://www.r-studio.com/
- Ventoy docs (disk layout): https://www.ventoy.net/en/doc_disk_layout.html
