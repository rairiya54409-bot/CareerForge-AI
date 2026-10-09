import os
import tempfile
import uuid

import whisper
import edge_tts

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from fastapi.responses import FileResponse

from app.routes.auth import get_current_user_id
from app.routes.chatbot import (
    get_user_context,
    get_user_language,
    ask_gemini,
    SUPPORTED_LANGUAGES,
)


router = APIRouter(
    prefix="/api/voice",
    tags=["Voice"],
)


MODEL_NAME = os.getenv(
    "WHISPER_MODEL",
    "base",
)

model = whisper.load_model(
    MODEL_NAME
)


ALLOWED_EXTENSIONS = {
    ".wav",
    ".mp3",
    ".m4a",
    ".webm",
    ".mp4",
    ".mpeg",
    ".mpga",
}


# Edge TTS voice for each supported language.
# English is used as a fallback.
TTS_VOICES = {
    "en": "en-US-AriaNeural",
    "hi": "hi-IN-SwaraNeural",
    "bn": "bn-IN-TanishaaNeural",
    "ta": "ta-IN-PallaviNeural",
    "te": "te-IN-ShrutiNeural",
    "mr": "mr-IN-AarohiNeural",
    "kn": "kn-IN-SapnaNeural",
    "ml": "ml-IN-SobhanaNeural",
    "gu": "gu-IN-DhwaniNeural",
    "pa": "pa-IN-VaaniNeural",
    "or": "or-IN-SubhasiniNeural",
}


def get_tts_voice(language: str) -> str:
    return TTS_VOICES.get(
        language,
        TTS_VOICES["en"],
    )


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No audio file provided",
        )

    extension = os.path.splitext(
        file.filename
    )[1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported audio format. "
                "Use WAV, MP3, M4A, WEBM or MP4."
            ),
        )

    audio_data = await file.read()

    if not audio_data:
        raise HTTPException(
            status_code=400,
            detail="Audio file is empty",
        )

    temporary_path = None

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension,
        ) as temporary_file:

            temporary_file.write(
                audio_data
            )

            temporary_path = (
                temporary_file.name
            )

        result = model.transcribe(
            temporary_path
        )

        text = result.get(
            "text",
            "",
        ).strip()

        if not text:
            raise HTTPException(
                status_code=400,
                detail="Could not detect speech",
            )

        return {
            "status": "success",
            "text": text,
            "language": result.get(
                "language"
            ),
        }

    except HTTPException:
        raise

    except Exception as error:
        print(
            "Speech transcription error:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to transcribe audio",
        )

    finally:
        if (
            temporary_path
            and os.path.exists(
                temporary_path
            )
        ):
            os.remove(
                temporary_path
            )


@router.post("/speak")
async def text_to_speech(
    text: str,
):
    if not text or not text.strip():
        raise HTTPException(
            status_code=400,
            detail="Text is required",
        )

    output_directory = (
        "app/uploads/voice"
    )

    os.makedirs(
        output_directory,
        exist_ok=True,
    )

    filename = (
        f"{uuid.uuid4()}.mp3"
    )

    output_path = os.path.join(
        output_directory,
        filename,
    )

    try:
        communicate = edge_tts.Communicate(
            text=text.strip(),
            voice=TTS_VOICES["en"],
        )

        await communicate.save(
            output_path
        )

        return FileResponse(
            output_path,
            media_type="audio/mpeg",
            filename="careerforge-response.mp3",
        )

    except Exception as error:
        print(
            "Text-to-speech error:",
            error,
        )

        if os.path.exists(
            output_path
        ):
            os.remove(
                output_path
            )

        raise HTTPException(
            status_code=500,
            detail="Unable to generate speech",
        )


@router.post("/assistant")
async def voice_assistant(
    file: UploadFile = File(...),
    current_user_id: str = Depends(
        get_current_user_id
    ),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No audio file provided",
        )

    extension = os.path.splitext(
        file.filename
    )[1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported audio format. "
                "Use WAV, MP3, M4A, WEBM or MP4."
            ),
        )

    audio_data = await file.read()

    if not audio_data:
        raise HTTPException(
            status_code=400,
            detail="Audio file is empty",
        )

    temporary_path = None
    output_path = None

    try:
        # --------------------------------
        # 1. Convert speech to text
        # --------------------------------

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension,
        ) as temporary_file:

            temporary_file.write(
                audio_data
            )

            temporary_path = (
                temporary_file.name
            )

        transcription = model.transcribe(
            temporary_path
        )

        user_text = transcription.get(
            "text",
            "",
        ).strip()

        if not user_text:
            raise HTTPException(
                status_code=400,
                detail="Could not detect speech",
            )

        # --------------------------------
        # 2. Get user's preferred language
        # --------------------------------

        language = get_user_language(
            current_user_id
        )

        language_name = SUPPORTED_LANGUAGES.get(
            language,
            "English",
        )

        # --------------------------------
        # 3. Get user's career context
        # --------------------------------

        context = get_user_context(
            current_user_id
        )

        # --------------------------------
        # 4. Ask Gemini
        # --------------------------------

        ai_response = ask_gemini(
            user_text,
            context,
            language,
        )

        if not ai_response:
            raise HTTPException(
                status_code=500,
                detail="Gemini returned an empty response",
            )

        # --------------------------------
        # 5. Convert Gemini response to speech
        # --------------------------------

        output_directory = (
            "app/uploads/voice"
        )

        os.makedirs(
            output_directory,
            exist_ok=True,
        )

        filename = (
            f"{uuid.uuid4()}.mp3"
        )

        output_path = os.path.join(
            output_directory,
            filename,
        )

        voice = get_tts_voice(
            language
        )

        communicate = edge_tts.Communicate(
            text=ai_response,
            voice=voice,
        )

        await communicate.save(
            output_path
        )

        # --------------------------------
        # 6. Return complete response
        # --------------------------------

        return {
            "status": "success",
            "transcription": user_text,
            "response": ai_response,
            "audio_url": (
                f"/api/voice/audio/{filename}"
            ),
            "language": language,
            "language_name": language_name,
            "detected_speech_language": (
                transcription.get("language")
            ),
            "tts_voice": voice,
        }

    except HTTPException:
        raise

    except Exception as error:
        print(
            "Voice assistant error:",
            error,
        )

        if (
            output_path
            and os.path.exists(
                output_path
            )
        ):
            os.remove(
                output_path
            )

        raise HTTPException(
            status_code=500,
            detail="Voice assistant failed",
        )

    finally:
        if (
            temporary_path
            and os.path.exists(
                temporary_path
            )
        ):
            os.remove(
                temporary_path
            )


@router.get(
    "/audio/{filename}"
)
async def get_voice_audio(
    filename: str,
):
    output_path = os.path.join(
        "app/uploads/voice",
        filename,
    )

    if not os.path.exists(
        output_path
    ):
        raise HTTPException(
            status_code=404,
            detail="Audio file not found",
        )

    return FileResponse(
        output_path,
        media_type="audio/mpeg",
        filename=filename,
    )