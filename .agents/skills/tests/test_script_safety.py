"""Regressions for imported skill helpers; no Git or external writes executed."""
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

SKILLS = Path(__file__).resolve().parents[1]
HOOK = SKILLS / 'git-guardrails-claude-code/scripts/block-dangerous-git.sh'
WIZARD = SKILLS / 'wizard/template.sh'


class ScriptSafetyTests(unittest.TestCase):
    def hook(self, command):
        return subprocess.run(
            ['/bin/bash', str(HOOK)],
            input=json.dumps({'tool_input': {'command': command}}),
            text=True, capture_output=True, check=False,
        )

    def test_read_only_command_allowed(self):
        self.assertEqual(self.hook('git status --short').returncode, 0)

    def test_blocked_commands_never_expose_input(self):
        for command in ('git push', 'git push --force', 'git reset --hard',
                        'git clean -fd', 'git branch -D task',
                        'git checkout .', 'git restore .'):
            with self.subTest(command=command):
                marker = 'FICTIONAL_SECRET_FOR_TEST'
                result = self.hook(command + ' ' + marker)
                self.assertEqual(result.returncode, 2)
                self.assertNotIn(marker, result.stdout + result.stderr)
                self.assertNotIn(command, result.stdout + result.stderr)

    def test_invalid_payload_blocked_without_disclosure(self):
        for payload in ('invalid FICTIONAL_SECRET', '{}',
                        '{"tool_input":{"command":null}}'):
            with self.subTest(payload=payload):
                result = subprocess.run(['/bin/bash', str(HOOK)], input=payload,
                                        text=True, capture_output=True, check=False)
                self.assertEqual(result.returncode, 2)
                self.assertNotIn('FICTIONAL_SECRET', result.stdout + result.stderr)
                self.assertNotIn('Traceback', result.stderr)

    def test_missing_parser_blocks(self):
        with tempfile.TemporaryDirectory() as directory:
            Path(directory, 'cat').symlink_to(shutil.which('cat'))
            result = subprocess.run(['/bin/bash', str(HOOK)], input='{}',
                                    env={'PATH': directory}, text=True,
                                    capture_output=True, check=False)
            self.assertEqual(result.returncode, 2)

    def test_matching_limit_is_explicit(self):
        # This regex aid intentionally is not a full shell/Git parser.
        self.assertEqual(self.hook('git -C /tmp push').returncode, 0)

    def test_distributed_wizard_is_inert(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            env_file = root / '.env'
            env_file.write_text('EXISTING=fictitious\n')
            bin_dir = root / 'bin'
            bin_dir.mkdir()
            marker = root / 'external-call'
            # Detect any attempt to launch the browser or publish through gh.
            for name in ('gh', 'xdg-open', 'open', 'wslview', 'explorer.exe'):
                stub = bin_dir / name
                stub.write_text('#!/bin/sh\ntouch "$TEST_EXTERNAL_CALL"\nexit 99\n')
                stub.chmod(0o755)
            import os
            env = dict(os.environ, PATH=str(bin_dir) + ':' + os.environ['PATH'],
                       TEST_EXTERNAL_CALL=str(marker), ENV_FILE=str(env_file))
            before = set(root.iterdir())
            result = subprocess.run(['/bin/bash', str(WIZARD)], cwd=root,
                                    env=env, input='', text=True,
                                    capture_output=True, check=False, timeout=5)
            self.assertEqual(result.returncode, 0)
            self.assertEqual(env_file.read_text(), 'EXISTING=fictitious\n')
            self.assertFalse(marker.exists())
            self.assertEqual(set(root.iterdir()), before)


if __name__ == '__main__':
    unittest.main()
