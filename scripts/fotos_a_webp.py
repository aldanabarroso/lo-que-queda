"""Convierte las fotos de fotos-originales/ a WebP para la web (public/img/).

Uso (desde la raíz del proyecto):
    py -3.12 -m pip install pillow        # una vez
    py -3.12 scripts/fotos_a_webp.py      # en Windows; en otros sistemas: python scripts/fotos_a_webp.py

Qué hace con cada .jpg / .jpeg / .png de fotos-originales/:
- respeta la orientación de la cámara (EXIF) y achica a 800 px de ancho como máximo: en la tarjeta la foto
  se ve a 400 px, así que 800 alcanza para pantallas de alta densidad. Nunca agranda.
- guarda public/img/<mismo nombre>.webp con calidad 80. No copia los metadatos (EXIF, GPS): solo el perfil
  de color, si lo hay.
Los originales no se tocan. Para cambiar una foto, reemplazar el original y volver a correr el script.
"""

from pathlib import Path

from PIL import Image, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
ORIGINALES = RAIZ / "fotos-originales"
DESTINO = RAIZ / "public" / "img"
ANCHO_MAX = 800
CALIDAD = 80


def convertir(origen: Path) -> tuple[int, int, tuple[int, int]]:
    with Image.open(origen) as im:
        icc = im.info.get("icc_profile")
        im = ImageOps.exif_transpose(im)  # gira según la cámara antes de achicar
        if im.mode not in ("RGB", "L"):
            im = im.convert("RGB")
        if im.width > ANCHO_MAX:
            alto = round(im.height * ANCHO_MAX / im.width)
            im = im.resize((ANCHO_MAX, alto), Image.LANCZOS)
        destino = DESTINO / f"{origen.stem}.webp"
        opciones = {"quality": CALIDAD, "method": 6}
        if icc:
            opciones["icc_profile"] = icc
        im.save(destino, "WEBP", **opciones)
        return origen.stat().st_size, destino.stat().st_size, im.size


def main() -> None:
    DESTINO.mkdir(parents=True, exist_ok=True)
    fotos = sorted(p for p in ORIGINALES.iterdir() if p.suffix.lower() in (".jpg", ".jpeg", ".png"))
    if not fotos:
        print(f"No hay fotos en {ORIGINALES}")
        return
    total_antes = total_despues = 0
    for p in fotos:
        antes, despues, (ancho, alto) = convertir(p)
        total_antes += antes
        total_despues += despues
        print(f"{p.name:18} {antes / 1024:6.0f} KB -> {p.stem}.webp {despues / 1024:5.0f} KB  ({ancho}x{alto}, "
              f"{100 * (1 - despues / antes):.0f} % menos)")
    print(f"{'Total':18} {total_antes / 1024:6.0f} KB -> {total_despues / 1024:5.0f} KB  "
          f"({100 * (1 - total_despues / total_antes):.0f} % menos)")


if __name__ == "__main__":
    main()
